import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/angular';

/** General prototype content authorized on 27/10; scientific review remains pending.
 * Static editorial content, unrelated to the observation or any AI output.
 */
@Component({
  selector: 'app-educational-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonAccordion, IonAccordionGroup, IonItem, IonLabel],
  template: `
    <section aria-labelledby="education-title">
      <h2 id="education-title">Sobre as abelhas</h2>
      <p class="notice">Conteúdo educativo preliminar — revisão científica pendente.</p>
      <p>Informações gerais. Não identificam a abelha da sua foto.</p>
      <ion-accordion-group value="pollination">
        @for (card of cards; track card.id) {
          <ion-accordion [value]="card.id">
            <ion-item slot="header">
              <ion-label class="ion-text-wrap">{{ card.title }}</ion-label>
            </ion-item>
            <div slot="content" class="ion-padding">
              <p>{{ card.text }}</p>
              <p class="review">Texto preliminar · revisão científica pendente</p>
              @for (source of card.sources; track source.url) {
                <a [href]="source.url" target="_blank" rel="noopener noreferrer">
                  {{ source.label }}
                  <span class="external">(abre no navegador)</span>
                </a>
              }
            </div>
          </ion-accordion>
        }
      </ion-accordion-group>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      font-size: 1.2rem;
      margin: 0 0 12px;
    }
    p {
      line-height: 1.5;
    }
    .notice {
      border-inline-start: 4px solid var(--ion-color-warning);
      padding-inline-start: 12px;
    }
    .review,
    .external {
      font-size: 0.85rem;
    }
    a {
      display: block;
      min-height: 44px;
      padding: 10px 0;
      color: var(--ion-text-color);
      text-decoration: underline;
      overflow-wrap: anywhere;
    }
  `,
})
export class EducationalContentComponent {
  protected readonly cards = [
    {
      id: 'pollination',
      title: 'O que é polinização?',
      text: 'Ao visitar flores, as abelhas podem transportar pólen de uma flor para outra. Esse processo ajuda na reprodução das plantas e contribui para a formação de frutos e sementes.',
      sources: [
        {
          label: 'Imperatriz-Fonseca e Nunes-Silva (2010) · Resultados e Discussão',
          url: 'https://www.scielo.br/j/bn/a/rfBTk4ydKLKJYFzd6VWFvsm/?format=html',
        },
      ],
    },
    {
      id: 'conservation',
      title: 'Conservar os lugares onde vivem',
      text: 'As abelhas precisam de lugares adequados para construir seus ninhos. Conservar a vegetação e locais de nidificação, como cavidades em árvores usadas por algumas espécies, ajuda a manter esses polinizadores.',
      sources: [
        { label: 'Santos (2010) · p. 103', url: 'https://www.naturezaonline.emnuvens.com.br/revista/article/view/387' },
        {
          label: 'Imperatriz-Fonseca e Nunes-Silva (2010) · Resultados e Discussão',
          url: 'https://www.scielo.br/j/bn/a/rfBTk4ydKLKJYFzd6VWFvsm/?format=html',
        },
      ],
    },
    {
      id: 'stingless',
      title: 'Por que “sem ferrão”?',
      text: 'Nas abelhas conhecidas como sem ferrão, as fêmeas têm o ferrão reduzido e não o utilizam para se defender. Esse nome descreve uma característica do grupo; não significa que todas as abelhas sejam iguais.',
      sources: [
        {
          label: 'Higino et al. (2023), em Bertolini et al. · capítulo 3, p. 73 (página 74 do PDF)',
          url: 'https://www.livrosabertos.abcd.usp.br/portaldelivrosUSP/catalog/book/1096',
        },
      ],
    },
    {
      id: 'food',
      title: 'Flores também são alimento',
      text: 'As flores oferecem recursos importantes para muitas abelhas. O pólen fornece nutrientes, enquanto o néctar é uma fonte de açúcares usada na alimentação.',
      sources: [
        {
          label: 'Imperatriz-Fonseca e Nunes-Silva (2010) · Resultados e Discussão',
          url: 'https://www.scielo.br/j/bn/a/rfBTk4ydKLKJYFzd6VWFvsm/?format=html',
        },
        {
          label: 'Higino et al. (2023), em Bertolini et al. · capítulo 3, p. 75 (página 76 do PDF)',
          url: 'https://www.livrosabertos.abcd.usp.br/portaldelivrosUSP/catalog/book/1096',
        },
      ],
    },
  ] as const;
}
