import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { EducationalContentComponent } from './educational-content.component';

/** Independent educational space requested by the teacher on 2026-10-30. */
@Component({
  selector: 'app-learn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, EducationalContentComponent],
  template: `
    <ion-header>
      <ion-toolbar color="primary"><ion-title>Aprender</ion-title></ion-toolbar>
    </ion-header>
    <ion-content>
      <main class="ion-padding">
        <p class="intro">Conheça as abelhas e sua importância para a natureza.</p>
        <app-educational-content />
      </main>
    </ion-content>
  `,
  styles: `
    main {
      max-width: 680px;
      margin: auto;
    }
    .intro {
      font-size: 1.1rem;
      line-height: 1.5;
      margin-bottom: 24px;
    }
  `,
})
export class LearnPage {}
