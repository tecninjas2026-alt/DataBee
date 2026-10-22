import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonText, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, camera, image, trashOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth/auth.service';
import { PhotoService } from '../../core/device/photo.service';
import { AppError, toUserMessage } from '../../core/errors/app-error';
import { PhotoSource } from '../../core/models/observation.model';
import { PreviewBannerComponent } from '../../shared/components/preview-banner.component';
import { RegistrationDraftStore } from './registration-draft.store';

/** Tela 3 — Novo Registro / Foto (IMP-018/019). Nada é enviado ao servidor aqui. */
@Component({
  selector: 'app-register-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'register-photo.page.html',
  styleUrls: ['register.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    PreviewBannerComponent,
  ],
})
export class RegisterPhotoPage {
  protected readonly draft = inject(RegistrationDraftStore);
  private readonly photos = inject(PhotoService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    addIcons({ camera, image, trashOutline, arrowForward });
  }

  protected async pick(source: PhotoSource): Promise<void> {
    const owner = this.auth.user()?.id;
    if (this.busy() || !owner) return;
    const revision = this.draft.revision;
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      const photo = await this.photos.pick(source);
      if (this.auth.user()?.id === owner && this.draft.revision === revision) {
        this.draft.setPhoto(photo);
      } else {
        URL.revokeObjectURL(photo.previewUrl);
      }
    } catch (error) {
      // Cancelar não é erro: mantém a foto anterior (se houver) e a tela utilizável.
      if (
        this.auth.user()?.id === owner &&
        this.draft.revision === revision &&
        !(error instanceof AppError && error.code === 'photo_cancelled')
      ) {
        this.errorMessage.set(toUserMessage(error));
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected discard(): void {
    this.draft.reset();
  }

  protected next(): void {
    void this.router.navigateByUrl('/tabs/registrar/dados');
  }
}
