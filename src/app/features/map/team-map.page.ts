import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
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
import type * as Leaflet from 'leaflet';
import { AuthService } from '../../core/auth/auth.service';
import { toUserMessage } from '../../core/errors/app-error';
import { TeamMapCell } from '../../core/models/team-map.model';
import { CURITIBA_REGION, CURITIBA_REGION_BOUNDS } from './curitiba-region.data';
import {
  gridCellCenter,
  MAP_GRID_METERS,
  MAP_X_METERS_PER_DEGREE,
  MAP_Y_METERS_PER_DEGREE,
} from './curitiba-region.geometry';
import { TeamMapService } from './team-map.service';

@Component({
  selector: 'app-team-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
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
  ],
  templateUrl: 'team-map.page.html',
  styleUrls: ['team-map.page.scss'],
})
export class TeamMapPage implements OnDestroy {
  @ViewChild('mapHost', { static: true }) private host!: ElementRef<HTMLDivElement>;
  private readonly auth = inject(AuthService);
  private readonly service = inject(TeamMapService);
  private readonly owner = signal<string | null>(null);
  private readonly records = signal<TeamMapCell[]>([]);
  protected readonly cells = computed(() => (this.owner() === this.auth.user()?.id ? this.records() : []));
  protected readonly total = computed(() => this.cells().reduce((n, c) => n + c.observations_count, 0));
  protected readonly selected = signal<TeamMapCell | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mapError = signal(false);
  protected readonly more = signal(false);
  private controller: AbortController | null = null;
  private active = false;
  private map: Leaflet.Map | null = null;
  private marks: Leaflet.LayerGroup | null = null;
  private leaflet: typeof Leaflet | null = null;
  private observer: ResizeObserver | null = null;
  constructor() {
    effect(() => {
      if (this.owner() !== this.auth.user()?.id) {
        this.records.set([]);
        this.selected.set(null);
        this.marks?.clearLayers();
      }
    });
  }
  ionViewWillEnter(): void {
    this.active = true;
    void this.load();
  }
  ionViewDidEnter(): void {
    void this.initMap();
  }
  ionViewDidLeave(): void {
    this.active = false;
    this.controller?.abort();
    this.controller = null;
    this.records.set([]);
    this.selected.set(null);
    this.loading.set(false);
    this.destroyMap();
  }
  ngOnDestroy(): void {
    this.active = false;
    this.controller?.abort();
    this.destroyMap();
  }
  protected async load(append = false): Promise<void> {
    if (append && this.loading()) return;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const owner = this.auth.user()?.id;
    const after = append ? (this.cells().at(-1) ?? null) : null;
    if (!append) {
      this.records.set([]);
      this.selected.set(null);
      this.marks?.clearLayers();
    }
    this.owner.set(owner ?? null);
    this.loading.set(true);
    this.error.set(null);
    try {
      const cells = await this.service.list(after, controller.signal);
      if (this.controller !== controller || controller.signal.aborted || owner !== this.auth.user()?.id || !this.active)
        return;
      this.records.update((current) => (append ? [...current, ...cells] : cells));
      this.more.set(cells.length === 250);
      this.drawCells();
    } catch (error) {
      if (this.controller === controller && !controller.signal.aborted && owner === this.auth.user()?.id)
        this.error.set(toUserMessage(error));
    } finally {
      if (this.controller === controller) this.loading.set(false);
    }
  }
  protected async initMap(): Promise<void> {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }
    this.mapError.set(false);
    try {
      const L = await import('leaflet/dist/leaflet-src.esm.js');
      if (!this.active || this.map) return;
      this.leaflet = L;
      const [west, south, east, north] = CURITIBA_REGION_BOUNDS;
      this.map = L.map(this.host.nativeElement, {
        minZoom: 7,
        maxZoom: 14,
        scrollWheelZoom: false,
        zoomControl: false,
        zoomSnap: 0.25,
        maxBounds: [
          [south - 0.2, west - 0.2],
          [north + 0.2, east + 0.2],
        ],
        attributionControl: false,
      });
      this.host.nativeElement.setAttribute(
        'aria-label',
        'Mapa regional da equipe. Áreas aproximadas de cerca de 2 km.',
      );
      L.control
        .zoom({ position: 'topright', zoomInTitle: 'Aproximar mapa', zoomOutTitle: 'Afastar mapa' })
        .addTo(this.map);
      L.control
        .attribution({ prefix: false })
        .addTo(this.map)
        .addAttribution(
          '<a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noopener noreferrer">IBGE</a> · <a href="https://www.amep.pr.gov.br/FAQ/Municipios-da-Regiao-Metropolitana-de-Curitiba" target="_blank" rel="noopener noreferrer">AMEP</a>',
        );
      for (const city of CURITIBA_REGION) {
        const rings = city.polygons.map((p) => p.map((r) => r.map(([lon, lat]) => [lat, lon] as Leaflet.LatLngTuple)));
        const label = document.createElement('span');
        label.textContent = city.name;
        const boundary = L.polygon(rings, {
          color: city.code === '4106902' ? '#ae7a15' : '#80967c',
          weight: 1,
          fillColor: city.code === '4106902' ? '#f3c85d' : '#dce7d7',
          fillOpacity: 1,
          interactive: true,
        })
          .bindTooltip(label, { sticky: true })
          .addTo(this.map);
        boundary.on('click', () => boundary.openTooltip());
      }
      this.marks = L.layerGroup().addTo(this.map);
      this.fitRegion();
      this.drawCells();
      this.observer = new ResizeObserver(() => this.map?.invalidateSize());
      this.observer.observe(this.host.nativeElement);
    } catch {
      this.destroyMap();
      if (this.active) this.mapError.set(true);
    }
  }
  protected fitRegion(): void {
    const [w, s, e, n] = CURITIBA_REGION_BOUNDS;
    this.map?.fitBounds(
      [
        [s, w],
        [n, e],
      ],
      { padding: [12, 12], animate: false },
    );
  }
  protected fitCuritiba(): void {
    const points = CURITIBA_REGION.find((c) => c.code === '4106902')?.polygons.flat(2);
    if (!points || !this.leaflet) return;
    this.map?.fitBounds(this.leaflet.latLngBounds(points.map(([lon, lat]) => [lat, lon] as Leaflet.LatLngTuple)), {
      padding: [16, 16],
      animate: false,
    });
  }
  protected choose(cell: TeamMapCell): void {
    this.selected.set(cell);
  }
  private drawCells(): void {
    const L = this.leaflet,
      map = this.map,
      marks = this.marks;
    if (!L || !map || !marks) return;
    marks.clearLayers();
    for (const cell of this.cells()) {
      const [lon, lat] = gridCellCenter(cell.cell_x, cell.cell_y),
        dx = MAP_GRID_METERS / 2 / MAP_X_METERS_PER_DEGREE,
        dy = MAP_GRID_METERS / 2 / MAP_Y_METERS_PER_DEGREE;
      L.rectangle(
        [
          [lat - dy, lon - dx],
          [lat + dy, lon + dx],
        ],
        { color: '#9a6b14', weight: 1, fillColor: '#efb943', fillOpacity: 0.4, interactive: false },
      ).addTo(marks);
      const marker = L.circleMarker([lat, lon], {
        radius: 14,
        color: '#ffffff',
        weight: 2,
        fillColor: cell.own_count ? '#785016' : '#3f6045',
        fillOpacity: 1,
      }).addTo(marks);
      marker
        .bindTooltip(String(cell.observations_count), {
          permanent: true,
          direction: 'center',
          className: 'map-cell-count',
        })
        .openTooltip();
      marker.on('click', () => this.choose(cell));
      const element = marker.getElement();
      if (element) {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute(
          'aria-label',
          `Área aproximada com ${cell.observations_count} ${cell.observations_count === 1 ? 'registro' : 'registros'}`,
        );
        element.addEventListener('keydown', (event) => {
          if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.choose(cell);
          }
        });
      }
    }
  }
  private destroyMap(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.map?.remove();
    this.map = null;
    this.marks = null;
  }
}
