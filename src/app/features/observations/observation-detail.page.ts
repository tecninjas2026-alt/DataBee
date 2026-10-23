import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnChanges, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../core/auth/auth.service';
import { toUserMessage } from '../../core/errors/app-error';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ANALYSIS_LABELS, ObservationsService, PrivateObservationDetail } from './observations.service';
import { PrivatePhotoComponent } from './private-photo.component';

/**
 * Tela 7 — Detalhe da Observação (IMP-037/041/042/044).
 * Dono: foto/dados, resultado persistido (sem chamar o VLM de novo), curadoria, Aprender, publicar/despublicar.
 * Outro usuário: somente published, sem GPS; foto via get-observation-image (URL 60 s).
 */
@Component({
  selector: 'app-observation-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    EmptyStateComponent,
    PrivatePhotoComponent,
  ],
  templateUrl: 'observation-detail.page.html',
  styleUrls: ['observations.page.scss'],
})
export class ObservationDetailPage implements OnChanges {
  /** Vem da rota `observacao/:id` (withComponentInputBinding). */
  readonly id = input.required<string>();
  private readonly auth = inject(AuthService);
  private readonly observations = inject(ObservationsService);
  private readonly record = signal<PrivateObservationDetail | null>(null);
  private controller: AbortController | null = null;
  protected readonly detail = computed(() =>
    this.record()?.observation.user_id === this.auth.user()?.id && this.record()?.observation.id === this.id()
      ? this.record()
      : null,
  );
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly labels = ANALYSIS_LABELS;

  ionViewWillEnter(): void {
    void this.load();
  }

  ngOnChanges(): void {
    // Navegar de um ID para outro pode reutilizar a mesma página Ionic.
    if (this.controller) void this.load();
  }
  ionViewDidLeave(): void {
    this.controller?.abort();
    this.controller = null;
    this.record.set(null);
    this.loading.set(false);
  }
  protected async load(): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const owner = this.auth.user()?.id;
    const id = this.id();
    this.record.set(null);
    this.error.set(null);
    this.loading.set(true);
    try {
      const detail = await this.observations.detail(id, controller.signal);
      if (
        this.controller === controller &&
        owner === this.auth.user()?.id &&
        id === this.id() &&
        !controller.signal.aborted
      )
        this.record.set(detail);
    } catch (error) {
      if (this.controller === controller && owner === this.auth.user()?.id && !controller.signal.aborted)
        this.error.set(toUserMessage(error));
    } finally {
      if (this.controller === controller) this.loading.set(false);
    }
  }
}
