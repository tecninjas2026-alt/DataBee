import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { ObservationUploadService } from './observation-upload.service';
import { UploadReference } from './upload-reference';

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
  protected readonly uploads = inject(ObservationUploadService);
  private readonly photos = inject(PhotoService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal<UploadReference[]>([]);
  protected readonly recoverySelection = signal<UploadReference | null>(null);
  protected readonly ownPending = computed(() =>
    this.pending().filter((item) => item.ownerId === this.auth.user()?.id),
  );

  ionViewWillEnter(): void {
    this.errorMessage.set(null);
    this.pending.set([]);
    this.recoverySelection.set(null);
    if (!this.auth.isAuthenticated()) return;
    try {
      this.pending.set(this.uploads.references());
    } catch (error) {
      this.errorMessage.set(toUserMessage(error));
    }
  }

  protected async recover(reference: UploadReference): Promise<void> {
    if (this.busy() || this.uploads.busy()) return;
    const owner = this.auth.user()?.id;
    this.errorMessage.set(null);
    try {
      const restored = await this.uploads.recover(reference);
      if (owner === this.auth.user()?.id) {
        if (restored === 'saved') void this.router.navigateByUrl(`/observacao/${reference.observationId}`);
        else if (restored) this.next();
        else {
          this.recoverySelection.set(reference);
          this.errorMessage.set(
            'A foto não chegou ao servidor. Escolha a imagem original da galeria para retomar este envio. Uma imagem diferente será recusada.',
          );
        }
      }
    } catch (error) {
      if (owner === this.auth.user()?.id) this.errorMessage.set(toUserMessage(error));
    }
  }

  constructor() {
    addIcons({ camera, image, trashOutline, arrowForward });
  }

  protected async pick(source: PhotoSource): Promise<void> {
    const owner = this.auth.user()?.id;
    if (this.busy() || this.uploads.busy() || !owner) return;
    const revision = this.draft.revision;
    const recovery = this.recoverySelection();
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      const photo = await this.photos.pick(source);
      if (this.auth.user()?.id === owner && this.draft.revision === revision) {
        if (recovery && recovery.ownerId === owner) {
          try {
            const restored = await this.uploads.recover(recovery, photo);
            this.recoverySelection.set(null);
            if (restored === 'saved') void this.router.navigateByUrl(`/observacao/${recovery.observationId}`);
            else this.next();
          } finally {
            URL.revokeObjectURL(photo.previewUrl);
          }
        } else this.draft.setPhoto(photo);
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
    if (this.busy() || this.uploads.busy()) return;
    this.draft.reset();
    this.recoverySelection.set(null);
  }

  protected cancelRecovery(): void {
    if (this.busy() || this.uploads.busy()) return;
    this.recoverySelection.set(null);
    this.errorMessage.set(null);
  }

  protected next(): void {
    void this.router.navigateByUrl('/tabs/registrar/dados');
  }
}
