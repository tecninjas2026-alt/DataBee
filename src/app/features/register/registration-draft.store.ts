import { computed, Injectable, signal } from '@angular/core';

import { DeviceLocation } from '../../core/device/location.service';
import { PickedPhoto } from '../../core/device/photo.service';

export type LocationConsent = 'unknown' | 'granted' | 'declined';

/**
 * Estado em memória do "Novo Registro" entre as telas 3 (Foto) e 4 (Dados e localização).
 * Nada aqui é enviado ao servidor; o upload/draft/salvar vem nas IMP-022/035.
 * Chame `reset()` ao concluir, descartar ou fazer logout para liberar a foto da memória.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationDraftStore {
  private version = 0;
  private readonly _photo = signal<PickedPhoto | null>(null);
  private readonly _location = signal<DeviceLocation | null>(null);
  private readonly _consent = signal<LocationConsent>('unknown');

  readonly photo = this._photo.asReadonly();
  readonly location = this._location.asReadonly();
  readonly consent = this._consent.asReadonly();
  readonly hasPhoto = computed(() => this._photo() !== null);

  /** Invalida respostas assíncronas iniciadas antes de trocar foto/conta ou sair. */
  get revision(): number {
    return this.version;
  }

  setPhoto(photo: PickedPhoto): void {
    this.version++;
    this.releasePhoto();
    this._photo.set(photo);
    this._location.set(null);
    this._consent.set('unknown');
  }

  setConsent(consent: LocationConsent): void {
    if (consent === 'granted' && this._photo()?.source !== 'camera') return;
    this._consent.set(consent);
    if (consent !== 'granted') this._location.set(null);
  }

  setLocation(location: DeviceLocation): void {
    if (this._photo()?.source !== 'camera' || this._consent() !== 'granted') return;
    this._location.set(location);
  }

  reset(): void {
    this.version++;
    this.releasePhoto();
    this._photo.set(null);
    this._location.set(null);
    this._consent.set('unknown');
  }

  private releasePhoto(): void {
    const current = this._photo();
    if (current) URL.revokeObjectURL(current.previewUrl);
  }
}
