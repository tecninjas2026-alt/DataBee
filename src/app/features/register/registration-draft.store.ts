import { computed, Injectable, signal } from '@angular/core';

import { DeviceLocation } from '../../core/device/location.service';
import { PickedPhoto } from '../../core/device/photo.service';

export type LocationConsent = 'unknown' | 'granted' | 'declined';

/**
 * Estado em memória do "Novo Registro" entre as telas 3 (Foto) e 4 (Dados e localização).
 * Foto/GPS ficam na memória; ObservationUploadService usa este estado para enviar o draft.
 * Chame `reset()` ao concluir, descartar ou fazer logout para liberar a foto da memória.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationDraftStore {
  private version = 0;
  private readonly _photo = signal<PickedPhoto | null>(null);
  private readonly _location = signal<DeviceLocation | null>(null);
  private readonly _consent = signal<LocationConsent>('unknown');
  private readonly _consentAt = signal<string | null>(null);
  private readonly _uploadId = signal<string | null>(null);
  private readonly _locationLocked = signal(false);

  readonly photo = this._photo.asReadonly();
  readonly location = this._location.asReadonly();
  readonly consent = this._consent.asReadonly();
  readonly consentAt = this._consentAt.asReadonly();
  readonly uploadId = this._uploadId.asReadonly();
  readonly locationLocked = this._locationLocked.asReadonly();
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
    this._consentAt.set(null);
    this._uploadId.set(null);
    this._locationLocked.set(false);
  }

  setUploadId(id: string, lockLocation = true): void {
    this._uploadId.set(id);
    this._locationLocked.set(lockLocation);
  }

  setConsent(consent: LocationConsent, consentAt: string | null = null): void {
    if (this._locationLocked()) return;
    if (consent === 'granted' && this._photo()?.source !== 'camera') return;
    this._consent.set(consent);
    this._consentAt.set(consent === 'granted' ? (consentAt ?? new Date().toISOString()) : null);
    if (consent !== 'granted') this._location.set(null);
  }

  setLocation(location: DeviceLocation): void {
    if (this._locationLocked()) return;
    if (this._photo()?.source !== 'camera' || this._consent() !== 'granted') return;
    this._location.set(location);
  }

  reset(): void {
    this.version++;
    this.releasePhoto();
    this._photo.set(null);
    this._location.set(null);
    this._consent.set('unknown');
    this._consentAt.set(null);
    this._uploadId.set(null);
    this._locationLocked.set(false);
  }

  private releasePhoto(): void {
    const current = this._photo();
    if (current) URL.revokeObjectURL(current.previewUrl);
  }
}
