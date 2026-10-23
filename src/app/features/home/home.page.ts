import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, lockClosed, logOutOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth/auth.service';
import { ACHIEVEMENTS } from '../../core/models/achievements';
import { PreviewBannerComponent } from '../../shared/components/preview-banner.component';
import { ObservationsService } from '../observations/observations.service';

/** Tela 2 — Início: chamada "Registrar abelha", resumo e as 3 conquistas (D23/D25). */
@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonSpinner,
    IonText,
    PreviewBannerComponent,
  ],
})
export class HomePage {
  protected readonly auth = inject(AuthService);
  protected readonly achievements = ACHIEVEMENTS;
  private readonly observations = inject(ObservationsService);
  private readonly count = signal<{ owner: string; value: number } | null>(null);
  private countRequest: AbortController | null = null;
  protected readonly countError = signal(false);
  protected readonly savedCount = computed(() =>
    this.count()?.owner === this.auth.user()?.id ? this.count()?.value : null,
  );
  // TODO(D23): calcular conquistas desbloqueadas.

  ionViewWillEnter(): void {
    void this.loadCount();
  }
  ionViewDidLeave(): void {
    this.countRequest?.abort();
    this.countRequest = null;
    this.count.set(null);
  }

  protected async loadCount(): Promise<void> {
    this.countRequest?.abort();
    const request = new AbortController();
    this.countRequest = request;
    const owner = this.auth.user()?.id;
    this.count.set(null);
    this.countError.set(false);
    if (!owner) return;
    try {
      const value = await this.observations.countSaved(request.signal);
      if (!request.signal.aborted && this.auth.user()?.id === owner) this.count.set({ owner, value });
    } catch {
      if (!request.signal.aborted && this.auth.user()?.id === owner) this.countError.set(true);
    }
  }

  constructor() {
    addIcons({ camera, lockClosed, logOutOutline });
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
