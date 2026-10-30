import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnChanges,
  OnDestroy,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCheckbox, IonSpinner, IonText } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { toUserMessage } from '../../core/errors/app-error';
import { OwnMapShare } from '../../core/models/team-map.model';
import { TeamMapService } from './team-map.service';

@Component({
  selector: 'app-map-share',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonButton, IonCard, IonCardContent, IonCheckbox, IonSpinner, IonText],
  template: `
    <ion-card>
      <ion-card-content>
        <h2>Mapa da equipe</h2>
        @if (loading() || busy()) {
          <p role="status">
            <ion-spinner name="crescent" />
            Conferindo compartilhamento…
          </p>
        }
        @if (error(); as message) {
          <ion-text color="danger">
            <p role="alert">{{ message }}</p>
          </ion-text>
          <ion-button fill="outline" (click)="load()" [disabled]="loading() || busy()">Consultar novamente</ion-button>
        } @else if (visibleState(); as share) {
          @if (share.is_shared) {
            <p>Uma área aproximada deste registro está compartilhada no mapa da equipe.</p>
            <p>A foto e o GPS exato continuam privados.</p>
            <ion-button fill="outline" expand="block" (click)="change(false)" [disabled]="busy() || loading()">
              Retirar do mapa
            </ion-button>
          } @else {
            <p>Ajude a equipe a visualizar onde foram feitos os registros.</p>
            <p>
              O mapa mostrará uma área de cerca de 2 km, sem sua foto, nome ou GPS exato. Pessoas autenticadas no
              DataBee poderão consultar as áreas e contagens. Compartilhar é opcional.
            </p>
            <ion-checkbox
              class="ion-text-wrap"
              labelPlacement="end"
              [checked]="consent()"
              (ionChange)="consent.set($event.detail.checked)"
              [disabled]="busy() || loading()"
            >
              Quero compartilhar esta área aproximada com a equipe.
            </ion-checkbox>
            <ion-button expand="block" (click)="change(true)" [disabled]="!consent() || busy() || loading()">
              Compartilhar área aproximada
            </ion-button>
            <p class="small">
              Requer GPS salvo pela câmera, com precisão suficiente, dentro de Curitiba ou da Região Metropolitana. Não
              ativa rastreamento.
            </p>
          }
        }
        <ion-button routerLink="/mapa" fill="clear" expand="block">Abrir mapa da equipe</ion-button>
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    p {
      line-height: 1.5;
    }
    h2 {
      font-size: 1.15rem;
    }
    ion-checkbox {
      width: 100%;
      margin: 12px 0;
      --size: 24px;
    }
    ion-button {
      min-height: 44px;
    }
    .small {
      font-size: 0.85rem;
    }
  `,
})
export class MapShareComponent implements OnChanges, OnDestroy {
  readonly observationId = input.required<string>();
  private readonly auth = inject(AuthService);
  private readonly service = inject(TeamMapService);
  private controller: AbortController | null = null;
  private readonly owner = signal<string | null>(null);
  private readonly state = signal<OwnMapShare | null>(null);
  protected readonly visibleState = computed(() => (this.owner() === this.auth.user()?.id ? this.state() : null));
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly consent = signal(false);
  constructor() {
    effect(() => {
      if (this.owner() && this.owner() !== this.auth.user()?.id) {
        this.controller?.abort();
        this.state.set(null);
        this.consent.set(false);
        this.error.set(null);
      }
    });
  }
  ngOnChanges(): void {
    void this.load();
  }
  ngOnDestroy(): void {
    this.controller?.abort();
    this.state.set(null);
    this.consent.set(false);
  }
  protected async load(): Promise<void> {
    if (this.busy()) return;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const owner = this.auth.user()?.id;
    const id = this.observationId();
    this.owner.set(owner ?? null);
    this.state.set(null);
    this.consent.set(false);
    this.error.set(null);
    this.loading.set(true);
    try {
      const state = await this.service.ownShare(id, controller.signal);
      if (this.current(controller, owner, id)) this.state.set(state);
    } catch (error) {
      if (this.current(controller, owner, id)) this.error.set(toUserMessage(error));
    } finally {
      if (this.controller === controller) this.loading.set(false);
    }
  }
  protected async change(share: boolean): Promise<void> {
    if (this.busy() || this.loading() || !this.visibleState() || (share && !this.consent())) return;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const owner = this.auth.user()?.id;
    const id = this.observationId();
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.service.setShare(id, share, controller.signal);
      const state = await this.service.ownShare(id, controller.signal);
      if (this.current(controller, owner, id)) {
        this.state.set(state);
        this.consent.set(false);
      }
    } catch (error) {
      if (this.current(controller, owner, id)) {
        this.state.set(null);
        this.error.set(toUserMessage(error));
      }
    } finally {
      if (this.controller === controller) this.busy.set(false);
    }
  }
  private current(controller: AbortController, owner: string | undefined, id: string): boolean {
    return (
      this.controller === controller &&
      !controller.signal.aborted &&
      owner === this.auth.user()?.id &&
      id === this.observationId()
    );
  }
}
