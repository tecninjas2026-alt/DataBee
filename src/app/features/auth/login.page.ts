import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonText,
} from '@ionic/angular';

import { AuthService } from '../../core/auth/auth.service';
import { toUserMessage } from '../../core/errors/app-error';
import { PreviewBannerComponent } from '../../shared/components/preview-banner.component';

type Mode = 'signin' | 'signup';

/** Tela 1 — Login/cadastro (IMP-016/033). */
@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonInput,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonText,
    PreviewBannerComponent,
  ],
})
export class LoginPage {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly mode = signal<Mode>('signin');
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    displayName: ['', [Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected setMode(value: unknown): void {
    this.mode.set(value === 'signup' ? 'signup' : 'signin');
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    const { displayName, email, password } = this.form.getRawValue();
    if (this.mode() === 'signup' && displayName.trim().length === 0) {
      this.errorMessage.set('Informe um nome ou apelido (pode ser pseudônimo).');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    try {
      if (this.mode() === 'signin') {
        await this.auth.signIn(email, password);
        await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
      } else {
        const result = await this.auth.signUp(email, password, displayName);
        if (result.needsEmailConfirmation) {
          this.infoMessage.set(
            'Confira sua caixa de entrada e o spam. Para entrar, confirme seu e-mail pelo link de cadastro.',
          );
          this.mode.set('signin');
        } else {
          await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
        }
      }
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    } finally {
      this.form.controls.password.reset();
      this.busy.set(false);
    }
  }

  ionViewDidLeave(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }

  protected explorePreview(): void {
    void this.router.navigateByUrl('/tabs/inicio');
  }
}
