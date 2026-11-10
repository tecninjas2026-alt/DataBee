import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCheckbox } from '@ionic/angular';
import { AuthService } from '../../core/auth/auth.service';
import { ATTENTIVE_EYE_TARGET } from '../../core/models/achievements';
import { ObservationsService } from './observations.service';

@Component({
  selector: 'app-photo-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IonButton, IonCard, IonCardContent, IonCheckbox],
  template: `
    <ion-card>
      <ion-card-content>
        <h2>Olhar Atento</h2>
        @switch (state()) {
          @case ('checking') {
            <p role="status">Consultando a conferência da foto…</p>
          }
          @case ('unavailable') {
            <p role="status">Não foi possível consultar a conferência.</p>
            <ion-button fill="outline" (click)="retry()">Tentar novamente</ion-button>
          }
          @case ('confirmed') {
            <p role="status">
              @if (earned()) {
                Você conquistou Olhar Atento!
              } @else {
                Esta foto já conta para Olhar Atento.
              }
            </p>
            <ion-button routerLink="/tabs/inicio" fill="clear">Ver conquistas no Início</ion-button>
          }
          @case ('duplicate') {
            <p role="status">Uma cópia idêntica desta foto já contou. Confira outra foto para avançar.</p>
          }
          @default {
            <p>Confira a foto acima e marque o que você consegue ver.</p>
            <ion-checkbox [checked]="framed()" [disabled]="!photoReady() || state() === 'saving'"
              (ionChange)="framed.set($event.detail.checked)">A abelha aparece inteira</ion-checkbox>
            <ion-checkbox [checked]="sharp()" [disabled]="!photoReady() || state() === 'saving'"
              (ionChange)="sharp.set($event.detail.checked)">A abelha está nítida</ion-checkbox>
            <ion-checkbox [checked]="lit()" [disabled]="!photoReady() || state() === 'saving'"
              (ionChange)="lit.set($event.detail.checked)">A abelha está bem iluminada</ion-checkbox>
            <ion-button expand="block" (click)="confirm()"
              [disabled]="!photoReady() || !framed() || !sharp() || !lit() || state() === 'saving'">
              {{ state() === 'saving' ? 'Confirmando…' : 'Confirmar foto' }}
            </ion-button>
            @if (saveError()) {
              <p role="alert">Não foi possível confirmar a foto. Tente novamente.</p>
            }
          }
        }
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    ion-checkbox {
      display: flex;
      min-height: 44px;
      margin-top: 4px;
      --size: 20px;
    }
  `,
})
export class PhotoReviewComponent {
  readonly observationId = input.required<string>();
  readonly photoReady = input.required<boolean>();
  private readonly auth = inject(AuthService);
  private readonly observations = inject(ObservationsService);
  private readonly attempt = signal(0);
  private controller: AbortController | null = null;
  protected readonly state = signal<'checking' | 'unavailable' | 'ready' | 'saving' | 'confirmed' | 'duplicate'>(
    'checking',
  );
  protected readonly framed = signal(false);
  protected readonly sharp = signal(false);
  protected readonly lit = signal(false);
  protected readonly earned = signal(false);
  protected readonly saveError = signal(false);

  constructor() {
    effect((onCleanup) => {
      const id = this.observationId();
      const owner = this.auth.user()?.id;
      this.attempt();
      const controller = new AbortController();
      this.controller = controller;
      onCleanup(() => controller.abort());
      this.state.set('checking');
      this.framed.set(false);
      this.sharp.set(false);
      this.lit.set(false);
      this.earned.set(false);
      this.saveError.set(false);
      if (owner) untracked(() => void this.load(id, controller.signal));
    });
  }

  protected retry(): void {
    this.attempt.update((value) => value + 1);
  }

  protected async confirm(): Promise<void> {
    const signal = this.controller?.signal;
    if (!signal || signal.aborted || this.state() !== 'ready' || !this.photoReady() ||
        !this.framed() || !this.sharp() || !this.lit()) return;
    this.state.set('saving');
    this.saveError.set(false);
    try {
      const status = await this.observations.confirmPhotoReview(this.observationId(), signal);
      if (signal.aborted) return;
      this.state.set(status);
      if (status === 'confirmed') void this.checkUnlock(signal);
    } catch {
      if (signal.aborted) return;
      this.state.set('ready');
      this.saveError.set(true);
    }
  }

  private async load(id: string, signal: AbortSignal): Promise<void> {
    try {
      const confirmed = await this.observations.hasPhotoReview(id, signal);
      if (!signal.aborted) this.state.set(confirmed ? 'confirmed' : 'ready');
    } catch {
      if (!signal.aborted) this.state.set('unavailable');
    }
  }

  private async checkUnlock(signal: AbortSignal): Promise<void> {
    try {
      const count = await this.observations.countPhotoReviews(signal);
      if (!signal.aborted) this.earned.set(count === ATTENTIVE_EYE_TARGET);
    } catch {
      // O Início pode recuperar a contagem mesmo se esta leitura falhar.
    }
  }
}
