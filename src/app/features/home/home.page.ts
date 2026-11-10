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
import { camera, checkmarkCircle, lockClosed, logOutOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth/auth.service';
import { ACHIEVEMENTS, ATTENTIVE_EYE_TARGET } from '../../core/models/achievements';
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
  protected readonly attentiveEyeTarget = ATTENTIVE_EYE_TARGET;
  private readonly observations = inject(ObservationsService);
  private readonly count = signal<{ owner: string; value: number } | null>(null);
  private readonly reviews = signal<{ owner: string; value: number } | null>(null);
  private countRequest: AbortController | null = null;
  protected readonly countError = signal(false);
  protected readonly reviewCountError = signal(false);
  protected readonly savedCount = computed(() =>
    this.count()?.owner === this.auth.user()?.id ? this.count()?.value : null,
  );
  protected readonly firstFlightEarned = computed(() => (this.savedCount() ?? 0) > 0);
  protected readonly photoProgress = computed(() => {
    const reviews = this.reviews();
    return reviews && reviews.owner === this.auth.user()?.id ? Math.min(reviews.value, ATTENTIVE_EYE_TARGET) : null;
  });

  ionViewWillEnter(): void {
    void this.loadCount();
  }
  ionViewDidLeave(): void {
    this.countRequest?.abort();
    this.countRequest = null;
    this.count.set(null);
    this.reviews.set(null);
  }

  protected async loadCount(): Promise<void> {
    this.countRequest?.abort();
    const request = new AbortController();
    this.countRequest = request;
    const owner = this.auth.user()?.id;
    this.count.set(null);
    this.countError.set(false);
    this.reviews.set(null);
    this.reviewCountError.set(false);
    if (!owner) return;
    void this.loadReviewCount(owner, request.signal);
    try {
      const value = await this.observations.countSaved(request.signal);
      if (!request.signal.aborted && this.auth.user()?.id === owner) this.count.set({ owner, value });
    } catch {
      if (!request.signal.aborted && this.auth.user()?.id === owner) this.countError.set(true);
    }
  }

  private async loadReviewCount(owner: string, signal: AbortSignal): Promise<void> {
    try {
      const value = await this.observations.countPhotoReviews(signal);
      if (!signal.aborted && this.auth.user()?.id === owner) this.reviews.set({ owner, value });
    } catch {
      if (!signal.aborted && this.auth.user()?.id === owner) this.reviewCountError.set(true);
    }
  }

  constructor() {
    addIcons({ camera, checkmarkCircle, lockClosed, logOutOutline });
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
