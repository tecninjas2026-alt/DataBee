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
import { AnalysisRequestService } from './analysis-request.service';
import { PROTOTYPE_SPECIES_CATALOG } from '../../../../supabase/catalog/prototype-species';

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
  private readonly requests = inject(AnalysisRequestService);
  private analysisController: AbortController | null = null;
  private readonly record = signal<SavedAnalysisView | null>(null);
  private controller: AbortController | null = null;
  protected readonly view = computed(() =>
    this.record()?.observation.user_id === this.auth.user()?.id && this.record()?.observation.id === this.id()
      ? this.record()
      : null,
  );
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly analyzing = signal(false);
  protected readonly analysisError = signal<string | null>(null);
  protected readonly canAnalyze = computed(() => {
    const observation = this.view()?.observation;
    return (
      !!observation &&
      (observation.analysis_status === 'idle' ||
        observation.analysis_status === 'failed' ||
        (observation.analysis_status === 'processing' &&
          (!observation.analysis_started_at || Date.now() - Date.parse(observation.analysis_started_at) >= 120000)))
    );
  });
  protected readonly candidates = computed(() => {
    const data = this.view();
    if (
      !data?.identification ||
      data.simulated ||
      data.identification.catalog_version !== PROTOTYPE_SPECIES_CATALOG.version
    )
      return [];
    return data.identification.result.matches.map((match) => ({
      ...match,
      taxon: PROTOTYPE_SPECIES_CATALOG.taxa.find((taxon) => taxon.id === match.taxonId),
    }));
  });

  ionViewWillEnter(): void {
    void this.load();
  }
  ngOnChanges(): void {
    if (this.controller) void this.load();
  }
  ionViewDidLeave(): void {
    this.analysisController?.abort();
    this.analysisController = null;
    this.analyzing.set(false);
    this.analysisError.set(null);
    this.controller?.abort();
    this.controller = null;
    this.record.set(null);
    this.error.set(null);
    this.loading.set(false);
  }
  protected async analyze(): Promise<void> {
    if (this.analyzing() || !this.canAnalyze()) return;
    const owner = this.auth.user()?.id;
    const id = this.id();
    const controller = new AbortController();
    this.analysisController = controller;
    this.analyzing.set(true);
    this.analysisError.set(null);
    try {
      await this.requests.analyze(id, controller.signal);
      if (
        this.analysisController === controller &&
        !controller.signal.aborted &&
        owner === this.auth.user()?.id &&
        id === this.id()
      )
        await this.load();
    } catch (error) {
      if (
        this.analysisController === controller &&
        !controller.signal.aborted &&
        owner === this.auth.user()?.id &&
        id === this.id()
      ) {
        this.analysisError.set(toUserMessage(error));
        await this.load();
      }
    } finally {
      if (this.analysisController === controller) {
        this.analyzing.set(false);
        this.analysisController = null;
      }
    }
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
