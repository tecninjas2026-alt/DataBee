import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locate, saveOutline } from 'ionicons/icons';

import { LocationService } from '../../core/device/location.service';
import { toUserMessage } from '../../core/errors/app-error';
import { PreviewBannerComponent } from '../../shared/components/preview-banner.component';
import { RegistrationDraftStore } from './registration-draft.store';
import { ObservationUploadService } from './observation-upload.service';
import { AuthService } from '../../core/auth/auth.service';
import { ObservationsService } from '../observations/observations.service';

/** Tela 4 — Novo Registro / Dados e localização (IMP-020; salvar = IMP-022/035). */
@Component({
  selector: 'app-register-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'register-details.page.html',
  styleUrls: ['register.page.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonNote,
    IonSpinner,
    IonText,
    PreviewBannerComponent,
  ],
})
export class RegisterDetailsPage {
  protected readonly draft = inject(RegistrationDraftStore);
  protected readonly uploadService = inject(ObservationUploadService);
  private readonly auth = inject(AuthService);
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly observations = inject(ObservationsService);
  private readonly toasts = inject(ToastController);

  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);

  constructor() {
    addIcons({ locate, saveOutline });
  }

  ionViewWillEnter(): void {
    this.uploadError.set(null);
    // Acesso direto pela URL sem foto: volta para a etapa 1.
    if (!this.draft.hasPhoto()) void this.router.navigateByUrl('/tabs/registrar', { replaceUrl: true });
  }

  protected async allowLocation(): Promise<void> {
    const photo = this.draft.photo();
    if (this.locating() || this.draft.locationLocked() || this.uploadService.busy() || photo?.source !== 'camera')
      return;
    this.draft.setConsent('granted');
    this.locating.set(true);
    this.locationError.set(null);
    try {
      const location = await this.locationService.getCurrent();
      if (this.draft.photo() === photo && this.draft.consent() === 'granted') {
        this.draft.setLocation(location);
      }
    } catch (error) {
      if (this.draft.photo() === photo && this.draft.consent() === 'granted') {
        this.locationError.set(toUserMessage(error));
      }
    } finally {
      this.locating.set(false);
    }
  }

  protected declineLocation(): void {
    if (this.draft.locationLocked() || this.uploadService.busy()) return;
    this.draft.setConsent('declined');
    this.locationError.set(null);
  }

  protected async saveObservation(): Promise<void> {
    if (this.uploadService.busy() || this.locating()) return;
    const owner = this.auth.user()?.id;
    const photo = this.draft.photo();
    this.uploadError.set(null);
    try {
      const id = await this.uploadService.save();
      if (this.auth.user()?.id === owner && this.draft.photo() === photo) {
        this.draft.reset();
        const url = `/observacao/${id}`;
        const navigated = await this.router.navigateByUrl(url, { replaceUrl: true });
        if (navigated && owner) void this.showFirstFlight(owner, url);
      }
    } catch (error) {
      if (this.auth.user()?.id === owner && this.draft.photo() === photo) this.uploadError.set(toUserMessage(error));
    }
  }

  private async showFirstFlight(owner: string, url: string): Promise<void> {
    try {
      if (this.auth.user()?.id !== owner || this.router.url !== url) return;
      const savedCount = await this.observations.countSaved(AbortSignal.timeout(5_000));
      if (savedCount !== 1 || this.auth.user()?.id !== owner || this.router.url !== url) return;

      const toast = await this.toasts.create({
        header: 'Primeiro Voo',
        message: 'Você registrou sua primeira observação!',
        duration: 5_000,
      });
      if (this.auth.user()?.id === owner && this.router.url === url) await toast.present();
    } catch {
      // A conquista pode ser consultada no Início mesmo se o aviso falhar.
    }
  }
}
