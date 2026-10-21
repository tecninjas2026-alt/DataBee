import { inject, Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';

import { AppError } from '../errors/app-error';
import { Profile, ProfileInsert } from '../models/profile.model';
import { SupabaseService } from '../supabase/supabase.service';

/** IMP-032 — lê/cria somente o perfil da conta atual, sem sobrescrever apelido salvo. */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseService);

  async ensureOwnProfile(user: User, signal: AbortSignal): Promise<Profile> {
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
    const existing = await this.readOwnProfile(user.id, requestSignal);
    if (existing) return existing;

    requestSignal.throwIfAborted();
    const metadataName: unknown = user.user_metadata['display_name'];
    const name = typeof metadataName === 'string' ? metadataName.trim() : '';
    const length = Array.from(name).length;
    const insert: ProfileInsert = {
      id: user.id,
      display_name: length >= 1 && length <= 80 ? name : 'Participante',
    };
    const { error } = await this.supabase.client
      .from('profiles')
      .upsert(insert, { onConflict: 'id', ignoreDuplicates: true })
      .abortSignal(requestSignal);
    if (error) throw this.profileError();

    // Outro cadastro/cliente pode ter criado a linha entre a leitura e o INSERT.
    const profile = await this.readOwnProfile(user.id, requestSignal);
    if (!profile) throw this.profileError();
    return profile;
  }

  private async readOwnProfile(userId: string, signal: AbortSignal): Promise<Profile | null> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, display_name, created_at')
      .eq('id', userId)
      .abortSignal(signal)
      .returns<Profile[]>()
      .maybeSingle();
    if (error) throw this.profileError();
    return data;
  }

  private profileError(): AppError {
    return new AppError('profile_unavailable', 'Não foi possível carregar seu perfil. Tente novamente.');
  }
}
