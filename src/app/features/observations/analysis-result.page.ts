import { DatePipe } from '@angular/common';
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
import { AnalysisResultsService, SavedAnalysisView } from './analysis-results.service';
import { EducationalContentComponent } from './educational-content.component';

/** IMP-030 preparation: reads the saved result, without a new analysis on entry or retry. */
@Component({
  selector: 'app-analysis-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonText,
    EmptyStateComponent,
    EducationalContentComponent,
  ],
  templateUrl: 'analysis-result.page.html',
  styleUrls: ['observations.page.scss'],
})
export class AnalysisResultPage implements OnChanges {
  readonly id = input.required<string>();
  private readonly auth = inject(AuthService);
  private readonly results = inject(AnalysisResultsService);
  private readonly record = signal<SavedAnalysisView | null>(null);
  private controller: AbortController | null = null;
  protected readonly view = computed(() =>
    this.record()?.observation.user_id === this.auth.user()?.id && this.record()?.observation.id === this.id()
      ? this.record()
      : null,
  );
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ionViewWillEnter(): void {
    void this.load();
  }
  ngOnChanges(): void {
    if (this.controller) void this.load();
  }
  ionViewDidLeave(): void {
    this.controller?.abort();
    this.controller = null;
    this.record.set(null);
    this.error.set(null);
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
      const record = await this.results.read(id, controller.signal);
      if (
        this.controller === controller &&
        owner === this.auth.user()?.id &&
        id === this.id() &&
        !controller.signal.aborted
      )
        this.record.set(record);
    } catch (error) {
      if (
        this.controller === controller &&
        owner === this.auth.user()?.id &&
        id === this.id() &&
        !controller.signal.aborted
      )
        this.error.set(toUserMessage(error));
    } finally {
      if (this.controller === controller) this.loading.set(false);
    }
  }
}
