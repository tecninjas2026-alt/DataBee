import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { AuthService } from './core/auth/auth.service';
import { RegistrationDraftStore } from './features/register/registration-draft.store';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly draft = inject(RegistrationDraftStore);
  private draftOwner: string | null = null;

  constructor() {
    // Troca direta A → B também precisa limpar a foto/GPS, mesmo sem evento de logout.
    effect(() => {
      if (!this.auth.initialized()) return;
      const owner = this.auth.user()?.id ?? null;
      if (owner !== this.draftOwner || !owner) {
        this.draft.reset();
        this.draftOwner = owner;
      }
      if (this.auth.previewMode() || owner) return;
      if (!this.router.url.startsWith('/login')) {
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }
}
