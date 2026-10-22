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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { locate, saveOutline } from 'ionicons/icons';

import { LocationService } from '../../core/device/location.service';
import { toUserMessage } from '../../core/errors/app-error';
import { PreviewBannerComponent } from '../../shared/components/preview-banner.component';
import { RegistrationDraftStore } from './registration-draft.store';

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
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);

  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);

  constructor() {
    addIcons({ locate, saveOutline });
  }

  ionViewWillEnter(): void {
    // Acesso direto pela URL sem foto: volta para a etapa 1.
    if (!this.draft.hasPhoto()) void this.router.navigateByUrl('/tabs/registrar', { replaceUrl: true });
  }

  protected async allowLocation(): Promise<void> {
    const photo = this.draft.photo();
    if (this.locating() || photo?.source !== 'camera') return;
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
    this.draft.setConsent('declined');
    this.locationError.set(null);
  }
}
