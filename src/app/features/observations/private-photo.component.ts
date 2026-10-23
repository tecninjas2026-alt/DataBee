import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { IonButton, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { ObservationsService } from './observations.service';

/** URL assinada curta, só em memória; nenhum token em disco ou logs. */
@Component({
  selector: 'app-private-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonSpinner],
  template: `
    @if (imageUrl(); as url) {
      <img [src]="url" alt="Foto da observação" loading="lazy" (error)="imageFailed()" />
    } @else if (loading()) {
      <p role="status">
        <ion-spinner name="crescent" />
        Carregando foto…
      </p>
    } @else if (canRead()) {
      <p>A foto não pôde ser carregada.</p>
      <ion-button fill="outline" size="small" (click)="refresh()">Recarregar foto</ion-button>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    img {
      display: block;
      width: 100%;
      max-height: 50vh;
      object-fit: contain;
      border-radius: var(--databee-radius);
      background: var(--ion-color-light);
    }
    p {
      padding: 12px;
    }
  `,
})
export class PrivatePhotoComponent {
  readonly observationId = input.required<string>();
  readonly ownerId = input.required<string>();
  private readonly auth = inject(AuthService);
  private readonly observations = inject(ObservationsService);
  private readonly url = signal<string | null>(null);
  private readonly attempt = signal(0);
  protected readonly loading = signal(false);
  protected readonly canRead = computed(() => this.auth.user()?.id === this.ownerId());
  protected readonly imageUrl = computed(() => (this.canRead() ? this.url() : null));
  constructor() {
    effect((onCleanup) => {
      const id = this.observationId();
      const owner = this.ownerId();
      const authenticated = this.auth.user()?.id;
      this.attempt();
      const controller = new AbortController();
      onCleanup(() => controller.abort());
      this.url.set(null);
      this.loading.set(false);
      if (owner === authenticated) untracked(() => void this.load(id, owner, controller));
    });
  }
  protected refresh(): void {
    this.attempt.update((value) => value + 1);
  }
  protected imageFailed(): void {
    this.url.set(null);
  }
  private async load(id: string, owner: string, controller: AbortController): Promise<void> {
    this.loading.set(true);
    try {
      const url = await this.observations.imageUrl(id, controller.signal);
      if (!controller.signal.aborted && this.auth.user()?.id === owner) this.url.set(url);
    } catch {
      /* Erro permite renovação explícita e autorizada da URL. */
    } finally {
      if (!controller.signal.aborted) this.loading.set(false);
    }
  }
}
