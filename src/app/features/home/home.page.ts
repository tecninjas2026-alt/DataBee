import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  // TODO(IMP-036): contar observações salvas do usuário; TODO(D23): calcular conquistas desbloqueadas.
  protected readonly savedCount = 0;

  constructor() {
    addIcons({ camera, lockClosed, logOutOutline });
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
