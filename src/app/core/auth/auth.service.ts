import { computed, inject, Injectable, signal } from '@angular/core';
import { isAuthError, Session, User } from '@supabase/supabase-js';

import { AppError, toUserMessage } from '../errors/app-error';
import { Profile } from '../models/profile.model';
import { ProfileService } from '../profiles/profile.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface SignUpResult {
  /** true quando o projeto exige confirmação por e-mail (D16) e ainda não há sessão. */
  needsEmailConfirmation: boolean;
}

/**
 * Estado de autenticação do app (signals) + operações de login/cadastro/logout.
 * Regras (IMP-016/033/034):
 * - Sessão restaurada no boot por `init()` (chamado em app.config.ts).
 * - Logout limpa a sessão local; um JWT já emitido pode valer até expirar (limitação documentada).
 * - Sem Supabase configurado o app entra em modo pré-visualização (`previewMode`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly profiles = inject(ProfileService);

  private readonly _session = signal<Session | null>(null);
  private readonly _initialized = signal(false);
  private readonly _profile = signal<Profile | null>(null);
  private readonly _profileLoading = signal(false);
  private readonly _profileError = signal<string | null>(null);
  private profileRequest: AbortController | null = null;
  private profileTimer: ReturnType<typeof setTimeout> | null = null;

  readonly session = this._session.asReadonly();
  readonly initialized = this._initialized.asReadonly();
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly previewMode = computed(() => !this.supabase.isConfigured);
  readonly profile = this._profile.asReadonly();
  readonly profileLoading = this._profileLoading.asReadonly();
  readonly profileError = this._profileError.asReadonly();
  /** O apelido salvo em profiles é a fonte; metadados só inicializam perfil ausente. */
  readonly displayName = computed(() => this._profile()?.display_name ?? null);

  async init(): Promise<void> {
    if (!this.supabase.isConfigured) {
      this._initialized.set(true);
      return;
    }
    const auth = this.supabase.client.auth;
    try {
      const { data, error } = await auth.getSession();
      if (error) throw error;
      this.updateSession(data.session);
    } catch {
      console.warn('[auth] Falha ao restaurar sessão');
      this.updateSession(null);
    } finally {
      this._initialized.set(true);
    }
    // Callback síncrono: as consultas de perfil ficam fora do lock da autenticação.
    auth.onAuthStateChange((_event, session) => this.updateSession(session));
  }

  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw mapAuthError(error);
    this.updateSession(data.session);
  }

  async signUp(email: string, password: string, displayName: string): Promise<SignUpResult> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    if (error) throw mapAuthError(error);
    this.updateSession(data.session);
    return { needsEmailConfirmation: data.session === null };
  }

  async signOut(): Promise<void> {
    if (this.supabase.isConfigured) {
      // scope 'local': encerra esta instalação; não depende de rede para limpar o estado.
      const { error } = await this.supabase.client.auth.signOut({ scope: 'local' });
      if (error) console.warn('[auth] signOut retornou erro; sessão local removida mesmo assim');
    }
    this.updateSession(null);
  }

  retryProfile(): void {
    const user = this.user();
    if (user && !this._profileLoading()) this.scheduleProfile(user);
  }

  private updateSession(session: Session | null): void {
    const changedAccount = this.user()?.id !== session?.user.id;
    this._session.set(session);
    if (changedAccount || !session) this.clearProfile();
    if (session && !this._profile() && !this._profileLoading() && !this._profileError()) {
      this.scheduleProfile(session.user);
    }
  }

  private clearProfile(): void {
    this.profileRequest?.abort();
    this.profileRequest = null;
    if (this.profileTimer !== null) clearTimeout(this.profileTimer);
    this.profileTimer = null;
    this._profile.set(null);
    this._profileLoading.set(false);
    this._profileError.set(null);
  }

  private scheduleProfile(user: User): void {
    this.clearProfile();
    const request = new AbortController();
    this.profileRequest = request;
    this._profileLoading.set(true);
    // Adia I/O, não a atualização da tela: o SDK pode emitir eventos sob lock.
    this.profileTimer = setTimeout(() => {
      this.profileTimer = null;
      void this.loadProfile(user, request);
    }, 0);
  }

  private async loadProfile(user: User, request: AbortController): Promise<void> {
    try {
      const profile = await this.profiles.ensureOwnProfile(user, request.signal);
      if (this.profileRequest === request && this.user()?.id === user.id) {
        this._profile.set(profile);
      }
    } catch (error) {
      if (this.profileRequest === request && this.user()?.id === user.id) {
        this._profileError.set(toUserMessage(error));
      }
    } finally {
      if (this.profileRequest === request) {
        this.profileRequest = null;
        this._profileLoading.set(false);
      }
    }
  }
}

function mapAuthError(error: unknown): AppError {
  if (!isAuthError(error)) {
    return new AppError('network', 'Sem conexão com o servidor. Tente novamente.', error);
  }
  switch (error.code) {
    case 'invalid_credentials':
      return new AppError('auth_invalid_credentials', 'E-mail ou senha incorretos.', error);
    case 'email_not_confirmed':
      return new AppError('auth_email_not_confirmed', 'Confirme seu e-mail antes de entrar.', error);
    case 'weak_password':
      return new AppError('auth_weak_password', 'Senha fraca. Use pelo menos 8 caracteres.', error);
    case 'user_already_exists':
    case 'email_exists':
      return new AppError('auth_user_exists', 'Já existe uma conta com este e-mail.', error);
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return new AppError('auth_rate_limited', 'Muitas tentativas. Aguarde alguns minutos.', error);
    default:
      return new AppError('unknown', 'Não foi possível concluir a autenticação. Tente novamente.', error);
  }
}
