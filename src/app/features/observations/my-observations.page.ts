import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from '@ionic/angular';

import { AuthService } from '../../core/auth/auth.service';
import { toUserMessage } from '../../core/errors/app-error';
import { Observation } from '../../core/models/observation.model';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ANALYSIS_LABELS, ObservationsService } from './observations.service';
import { PrivatePhotoComponent } from './private-photo.component';

/** Tela 6 — Minhas Observações (IMP-036). Lista somente as observações do próprio usuário (RLS). */
@Component({
  selector: 'app-my-observations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    EmptyStateComponent,
    PrivatePhotoComponent,
  ],
  templateUrl: 'my-observations.page.html',
  styleUrls: ['observations.page.scss'],
})
export class MyObservationsPage {
  private readonly auth = inject(AuthService);
  private readonly observations = inject(ObservationsService);
  private readonly records = signal<Observation[]>([]);
  private readonly drafts = signal<Observation[]>([]);
  private controller: AbortController | null = null;
  protected readonly items = computed(() => this.records().filter((item) => item.user_id === this.auth.user()?.id));
  protected readonly pending = computed(() => this.drafts().filter((item) => item.user_id === this.auth.user()?.id));
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly more = signal(false);
  protected readonly labels = ANALYSIS_LABELS;

  ionViewWillEnter(): void {
    void this.load();
  }
  ionViewDidLeave(): void {
    this.controller?.abort();
    this.controller = null;
    this.records.set([]);
    this.drafts.set([]);
    this.loading.set(false);
  }
  protected async refresh(event: RefresherCustomEvent): Promise<void> {
    try {
      await this.load();
    } finally {
      await event.target.complete();
    }
  }
  protected async load(append = false): Promise<void> {
    if (append && this.loading()) return;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const owner = this.auth.user()?.id;
    if (!append) {
      this.records.set([]);
      this.drafts.set([]);
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const offset = append ? this.items().length : 0;
      const [items, drafts] = await Promise.all([
        this.observations.list('saved', offset, controller.signal),
        this.observations.list('draft', 0, controller.signal),
      ]);
      if (this.controller !== controller || owner !== this.auth.user()?.id || controller.signal.aborted) return;
      this.records.update((current) =>
        append ? [...current, ...items.filter((item) => !current.some((old) => old.id === item.id))] : items,
      );
      this.drafts.set(drafts);
      this.more.set(items.length === 20);
    } catch (error) {
      if (this.controller === controller && owner === this.auth.user()?.id && !controller.signal.aborted)
        this.error.set(toUserMessage(error));
    } finally {
      if (this.controller === controller) this.loading.set(false);
    }
  }
}
