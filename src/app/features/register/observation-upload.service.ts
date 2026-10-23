import { inject, Injectable, signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { APP_CONFIG } from '../../core/config/app-config';
import { OBSERVATION_STORAGE } from '../../core/config/observation-storage';
import { DeviceLocation } from '../../core/device/location.service';
import { PickedPhoto } from '../../core/device/photo.service';
import { AppError } from '../../core/errors/app-error';
import { Observation, ObservationImage, ObservationPrivateLocation } from '../../core/models/observation.model';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { RegistrationDraftStore } from './registration-draft.store';
import { isUploadReference, photoDigest, uploadPath, UploadReference } from './upload-reference';

/** IMP-022: envia um rascunho privado; não promove para saved nem chama IA. */
@Injectable({ providedIn: 'root' })
export class ObservationUploadService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly draft = inject(RegistrationDraftStore);
  private readonly _busy = signal(false);
  private readonly _progress = signal('');
  readonly busy = this._busy.asReadonly();
  readonly progress = this._progress.asReadonly();

  references(): UploadReference[] {
    const owner = this.requireOwner();
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(this.key(owner)) ?? '[]');
      if (!Array.isArray(parsed) || !parsed.every((item: unknown) => isUploadReference(item, owner))) {
        throw new Error('invalid journal');
      }
      return parsed as UploadReference[];
    } catch {
      throw this.failure(
        'Não foi possível ler os envios deste aparelho. Não apague os dados do app; peça ajuda à equipe.',
      );
    }
  }

  async upload(): Promise<UploadReference> {
    return this.exclusive((owner) => this.uploadDraft(owner));
  }

  /** Confirma no servidor o mesmo registro, sem iniciar IA. */
  async save(): Promise<string> {
    return this.exclusive(async (owner) => {
      const revision = this.draft.revision;
      const reference = await this.uploadDraft(owner, true);
      this.checkContext(owner, revision);
      this._progress.set('Confirmando o salvamento privado…');
      try {
        await this.supabase.client.functions.invoke('save-observation', {
          body: { observation_id: reference.observationId },
          signal: AbortSignal.timeout(45_000),
        });
      } catch {
        /* Uma falha de rede ainda exige reconciliação pelo banco abaixo. */
      }
      this.checkContext(owner, revision);
      // Uma resposta perdida não prova falha: consultar o mesmo ID no banco.
      const observation = await this.readObservation(reference);
      this.checkContext(owner, revision);
      if (
        observation?.lifecycle !== 'saved' ||
        observation.publication !== 'private' ||
        observation.analysis_status !== 'idle'
      ) {
        throw this.failure(
          'O salvamento ainda não foi confirmado. Sua foto e referência foram preservadas. Tente novamente.',
        );
      }
      this.forget(reference);
      return observation.id;
    });
  }

  private async uploadDraft(owner: string, allowSaved = false): Promise<UploadReference> {
    const photo = this.draft.photo();
    if (!photo) throw this.failure('Escolha uma foto antes de enviar.');
    const revision = this.draft.revision;
    const check = (): void => this.checkContext(owner, revision);
    await this.validatePhoto(photo);
    check();
    const digest = await photoDigest(photo.blob);
    check();
    const previousId = this.draft.uploadId();
    let reference = previousId ? this.references().find((item) => item.observationId === previousId) : undefined;
    if (previousId && !reference)
      throw this.failure('A referência deste envio não está disponível. Retome pela lista de envios.');
    if (
      reference &&
      (reference.sha256 !== digest || reference.source !== photo.source || reference.bytes !== photo.bytes)
    ) {
      throw this.failure('Esta foto é diferente da foto reservada. Retome o envio original.');
    }
    if (reference && allowSaved) {
      const observation = await this.readObservation(reference);
      check();
      if (observation?.lifecycle === 'saved') return reference;
    }
    const location = this.draft.location();
    if (!reference && this.draft.consent() === 'granted' && !location) {
      throw this.failure('A localização ainda não foi obtida. Tente o GPS novamente ou escolha Não usar localização.');
    }
    if (!reference) {
      reference = {
        version: 1,
        ownerId: owner,
        observationId: crypto.randomUUID(),
        imageId: crypto.randomUUID(),
        sha256: digest,
        bytes: photo.bytes,
        source: photo.source,
        capturedAt: photo.capturedAt,
        consentAt: this.draft.consentAt(),
        withLocation: photo.source === 'camera' && this.draft.consent() === 'granted' && location !== null,
        stage: 'reserved',
      };
      // A referência deve sobreviver ao fechamento ANTES de criar qualquer recurso remoto.
      this.remember(reference);
      this.draft.setUploadId(reference.observationId);
    }
    check();
    await this.ensureDraft(reference, check);
    await this.ensureLocation(reference, location, check);
    await this.ensureFile(reference, photo, check);
    await this.ensureMetadata(reference, check);
    check();
    this.advance(reference, 'ready', 'Foto enviada. O rascunho continua privado e sem análise.');
    return reference;
  }

  /** Recupera pelo servidor, sem guardar a foto nem coordenadas no aparelho. */
  async recover(reference: UploadReference, selected?: PickedPhoto): Promise<boolean | 'saved'> {
    return this.exclusive(async (owner) => {
      const revision = this.draft.revision;
      const check = (): void => this.checkContext(owner, revision);
      if (
        !isUploadReference(reference, owner) ||
        !this.references().some((item) => item.observationId === reference.observationId)
      ) {
        throw this.failure('Este envio não pertence à conta atual.');
      }
      const observation = await this.readObservation(reference);
      check();
      if (observation?.lifecycle === 'saved') {
        this.forget(reference);
        return 'saved';
      }
      if (observation) this.assertDraft(observation, reference);
      const location = observation ? await this.readLocation(reference) : null;
      check();
      let blob = observation ? await this.download(reference) : null;
      check();
      // Nova seleção só repõe os mesmos bytes; não muda a origem nem a data da reserva.
      if (!blob && selected) blob = selected.blob;
      if (!blob) {
        return false;
      }
      await this.assertDigest(blob, reference);
      if (
        location &&
        (location.accuracy === null ||
          location.location_source !== 'device_gps' ||
          reference.source !== 'camera' ||
          !sameTime(location.consent_at, reference.consentAt))
      ) {
        throw this.failure('A localização deste envio precisa de revisão pela equipe.');
      }
      const bitmap = await createImageBitmap(blob);
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();
      check();
      this.draft.setPhoto({
        blob,
        previewUrl: URL.createObjectURL(blob),
        source: reference.source,
        mimeType: 'image/jpeg',
        bytes: blob.size,
        width,
        height,
        capturedAt: reference.capturedAt,
      });
      if (location) {
        this.draft.setConsent('granted', reference.consentAt);
        this.draft.setLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy as number,
          readAt: reference.consentAt ?? '',
        });
      }
      if (!reference.withLocation) this.draft.setConsent('declined');
      // GPS confirmado é recuperado. Se faltou gravá-lo, pedir escolha explícita nova.
      this.draft.setUploadId(reference.observationId, location !== null || !reference.withLocation);
      return true;
    });
  }

  private async ensureDraft(reference: UploadReference, check: () => void): Promise<void> {
    this.advance(reference, 'draft', 'Preparando o rascunho privado…');
    let observation = await this.readObservation(reference);
    check();
    if (!observation) {
      const { error } = await this.supabase.client
        .from('observations')
        .insert({
          id: reference.observationId,
          user_id: reference.ownerId,
          photo_source: reference.source,
          captured_at: reference.capturedAt,
        })
        .abortSignal(AbortSignal.timeout(30_000));
      check();
      // Mesmo com erro, o servidor pode ter confirmado a escrita. Reconsultar o MESMO ID.
      observation = await this.readObservation(reference);
      check();
      if (!observation) throw error ?? this.failure('O rascunho ainda não foi confirmado. Tente novamente.');
    }
    this.assertDraft(observation, reference);
  }

  private async ensureLocation(
    reference: UploadReference,
    location: DeviceLocation | null,
    check: () => void,
  ): Promise<void> {
    this.advance(reference, 'location', 'Conferindo a localização opcional…');
    const existing = await this.readLocation(reference);
    check();
    if (reference.withLocation && !existing && !this.draft.locationLocked()) {
      if (this.draft.consent() === 'unknown' || (this.draft.consent() === 'granted' && !location)) {
        throw this.failure(
          'A localização anterior não chegou ao servidor. Escolha obter o GPS novamente ou continuar sem localização.',
        );
      }
      reference.withLocation = this.draft.consent() === 'granted' && location !== null;
      reference.consentAt = reference.withLocation ? this.draft.consentAt() : null;
      this.remember(reference);
      this.draft.setUploadId(reference.observationId);
    }
    if (!reference.withLocation) {
      if (existing)
        throw this.failure('A localização deste rascunho não corresponde à escolha original. Peça ajuda à equipe.');
      return;
    }
    if (existing) {
      if (
        existing.owner_id !== reference.ownerId ||
        existing.location_source !== 'device_gps' ||
        !sameTime(existing.consent_at, reference.consentAt) ||
        (location &&
          (existing.latitude !== location.latitude ||
            existing.longitude !== location.longitude ||
            existing.accuracy !== location.accuracy))
      ) {
        throw this.failure('A localização registrada é diferente da localização deste envio.');
      }
      return;
    }
    if (!location || !reference.consentAt)
      throw this.failure('A localização autorizada não está mais na memória. Preserve o envio e peça ajuda à equipe.');
    const { error } = await this.supabase.client
      .from('observation_private_locations')
      .insert({
        observation_id: reference.observationId,
        owner_id: reference.ownerId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        location_source: 'device_gps',
        consent_at: reference.consentAt,
      })
      .abortSignal(AbortSignal.timeout(30_000));
    check();
    if (error) {
      const reconciled = await this.readLocation(reference);
      check();
      if (
        !reconciled ||
        reconciled.latitude !== location.latitude ||
        reconciled.longitude !== location.longitude ||
        reconciled.accuracy !== location.accuracy ||
        reconciled.location_source !== 'device_gps' ||
        !sameTime(reconciled.consent_at, reference.consentAt)
      )
        throw error;
    }
  }

  private async ensureFile(reference: UploadReference, photo: PickedPhoto, check: () => void): Promise<void> {
    this.advance(reference, 'file', 'Enviando a foto para a pasta privada…');
    const existing = await this.download(reference);
    check();
    if (existing) {
      await this.assertDigest(existing, reference);
      check();
      return;
    }
    const metadata = await this.readImage(reference);
    check();
    if (metadata)
      throw this.failure('A etiqueta da foto existe, mas o arquivo não foi encontrado. Peça ajuda à equipe.');
    const request = this.supabase.client.storage
      .from(OBSERVATION_STORAGE.bucketId)
      .upload(uploadPath(reference), photo.blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '0' });
    // A API upload desta versão não recebe AbortSignal. A resposta tardia não
    // inicia outras etapas; o retry confere o mesmo caminho, sempre sem upsert.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { error } = await Promise.race([
      request,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              this.failure(
                'O envio demorou mais que o esperado. A foto pode ter chegado; tente novamente para conferir o mesmo envio.',
              ),
            ),
          60_000,
        );
      }),
    ]).finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    });
    check();
    // Confirma conteúdo real; uma resposta perdida ou conflito não deve gerar nova foto.
    const confirmed = await this.download(reference);
    check();
    if (!confirmed) throw error ?? this.failure('Não foi possível confirmar o envio da foto. Tente novamente.');
    await this.assertDigest(confirmed, reference);
    check();
  }

  private async ensureMetadata(reference: UploadReference, check: () => void): Promise<void> {
    this.advance(reference, 'metadata', 'Vinculando a foto ao rascunho…');
    let image = await this.readImage(reference);
    check();
    if (!image) {
      const { error } = await this.supabase.client
        .from('observation_images')
        .insert({
          id: reference.imageId,
          observation_id: reference.observationId,
          owner_id: reference.ownerId,
          object_path: uploadPath(reference),
          mime_type: 'image/jpeg',
          bytes: reference.bytes,
          photo_source: reference.source,
          position: 0,
        })
        .abortSignal(AbortSignal.timeout(30_000));
      check();
      image = await this.readImage(reference);
      check();
      // Nunca apagar diante de resposta incerta. A referência durável permite reconciliar depois.
      if (!image) throw error ?? this.failure('A foto chegou, mas o vínculo ficou pendente. Tente novamente.');
    }
    if (
      image.id !== reference.imageId ||
      image.owner_id !== reference.ownerId ||
      image.object_path !== uploadPath(reference) ||
      image.bytes !== reference.bytes ||
      image.mime_type !== 'image/jpeg' ||
      image.photo_source !== reference.source ||
      image.position !== 0
    ) {
      throw this.failure('O arquivo e a etiqueta deste rascunho não correspondem. Peça ajuda à equipe.');
    }
  }

  private async readObservation(reference: UploadReference): Promise<Observation | null> {
    const { data, error } = await this.supabase.client
      .from('observations')
      .select('*')
      .eq('id', reference.observationId)
      .eq('user_id', reference.ownerId)
      .abortSignal(AbortSignal.timeout(30_000))
      .maybeSingle<Observation>();
    if (error) throw error;
    return data;
  }

  private async readLocation(reference: UploadReference): Promise<ObservationPrivateLocation | null> {
    const { data, error } = await this.supabase.client
      .from('observation_private_locations')
      .select('*')
      .eq('observation_id', reference.observationId)
      .eq('owner_id', reference.ownerId)
      .abortSignal(AbortSignal.timeout(30_000))
      .maybeSingle<ObservationPrivateLocation>();
    if (error) throw error;
    return data;
  }

  private async readImage(reference: UploadReference): Promise<ObservationImage | null> {
    const { data, error } = await this.supabase.client
      .from('observation_images')
      .select('*')
      .eq('observation_id', reference.observationId)
      .eq('owner_id', reference.ownerId)
      .abortSignal(AbortSignal.timeout(30_000))
      .maybeSingle<ObservationImage>();
    if (error) throw error;
    return data;
  }

  private async download(reference: UploadReference): Promise<Blob | null> {
    const { data, error } = await this.supabase.client.storage
      .from(OBSERVATION_STORAGE.bucketId)
      .download(uploadPath(reference), {}, { signal: AbortSignal.timeout(60_000), cache: 'no-store' });
    if (error) {
      // Só o código explícito de objeto ausente permite criar um arquivo; rede/403 não são ausência.
      if (
        ('code' in error && error.code === 'NoSuchKey') ||
        ('statusCode' in error && String(error.statusCode) === '404')
      )
        return null;
      throw error;
    }
    return data;
  }

  private assertDraft(observation: Observation, reference: UploadReference): void {
    if (
      observation.user_id !== reference.ownerId ||
      observation.lifecycle !== 'draft' ||
      observation.publication !== 'private' ||
      observation.analysis_status !== 'idle' ||
      observation.photo_source !== reference.source ||
      !sameTime(observation.captured_at, reference.capturedAt)
    ) {
      throw this.failure('Este rascunho mudou no servidor. Não vamos sobrescrevê-lo. Peça ajuda à equipe.');
    }
  }

  private async validatePhoto(photo: PickedPhoto): Promise<void> {
    if (
      photo.blob.type !== 'image/jpeg' ||
      photo.mimeType !== 'image/jpeg' ||
      photo.blob.size !== photo.bytes ||
      photo.bytes < 1 ||
      photo.bytes > OBSERVATION_STORAGE.maxBytes ||
      photo.width < 1 ||
      photo.height < 1 ||
      Math.max(photo.width, photo.height) > APP_CONFIG.maxPhotoDimension ||
      (photo.source === 'gallery' && photo.capturedAt !== null)
    ) {
      throw this.failure('A foto não está pronta para envio. Escolha novamente a imagem.');
    }
    const bytes = new Uint8Array(await photo.blob.slice(0, 3).arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw this.failure('A foto não é um JPEG válido.');
  }

  private async assertDigest(blob: Blob, reference: UploadReference): Promise<void> {
    if (blob.size !== reference.bytes || (await photoDigest(blob)) !== reference.sha256) {
      throw this.failure('A foto encontrada é diferente da foto deste envio. Nenhum arquivo foi sobrescrito.');
    }
  }

  private remember(reference: UploadReference): void {
    const items = this.references().filter((item) => item.observationId !== reference.observationId);
    const serialized = JSON.stringify([reference, ...items]);
    try {
      localStorage.setItem(this.key(reference.ownerId), serialized);
      if (localStorage.getItem(this.key(reference.ownerId)) !== serialized) throw new Error('journal not stored');
    } catch {
      throw this.failure(
        'Não foi possível preservar a recuperação no aparelho. O envio foi interrompido para evitar duplicatas.',
      );
    }
  }

  private forget(reference: UploadReference): void {
    // O registro confirmado continua no servidor mesmo se a limpeza local falhar.
    // A referência remanescente redireciona para o detalhe ao retomar.
    try {
      const items = this.references().filter((item) => item.observationId !== reference.observationId);
      localStorage.setItem(this.key(reference.ownerId), JSON.stringify(items));
    } catch {
      /* Preservar referência para reconciliação futura. */
    }
  }

  private advance(reference: UploadReference, stage: UploadReference['stage'], message: string): void {
    reference.stage = stage;
    this.remember(reference);
    this._progress.set(message);
  }

  private async exclusive<T>(action: (owner: string) => Promise<T>): Promise<T> {
    if (this._busy()) throw this.failure('Já existe um envio em andamento. Aguarde.');
    const owner = this.requireOwner();
    this._busy.set(true);
    this._progress.set('Conferindo o envio…');
    try {
      // Uma só operação por conta, inclusive entre abas do mesmo aparelho.
      if (!navigator.locks)
        throw this.failure(
          'Este aparelho não oferece a proteção necessária para enviar. Atualize o Android System WebView.',
        );
      return await navigator.locks.request(`databee-upload:${owner}`, { ifAvailable: true }, async (lock) => {
        if (!lock) throw this.failure('Há um envio aberto em outra aba. Aguarde e tente novamente.');
        if (this.requireOwner() !== owner) throw this.failure('A conta mudou. Entre novamente para retomar.');
        return action(owner);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw this.failure(
        'Não foi possível concluir o envio. A referência foi preservada neste aparelho. Verifique a internet e tente novamente; se a foto já chegou, ela será reaproveitada.',
      );
    } finally {
      this._busy.set(false);
    }
  }

  private checkContext(owner: string, revision: number): void {
    if (this.auth.user()?.id !== owner || this.draft.revision !== revision) {
      throw this.failure('O envio foi interrompido porque a conta ou a foto mudou. Retome pela conta original.');
    }
  }

  private requireOwner(): string {
    const owner = this.auth.user()?.id;
    if (!owner) throw this.failure('Entre na sua conta para enviar a foto.');
    return owner;
  }

  private key(owner: string): string {
    return `databee:uploads:v1:${owner}`;
  }
  private failure(message: string): AppError {
    return new AppError('upload_pending', message);
  }
}

function sameTime(left: string | null, right: string | null): boolean {
  return left === null || right === null ? left === right : Date.parse(left) === Date.parse(right);
}
