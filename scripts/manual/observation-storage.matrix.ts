/** IMP-015 — roteiro SDK manual, somente no dev com a migration aplicada.
 * Usar somente contas dev A/B e imagem sintética gerada pela equipe.
 * Mantém dados/arquivos de teste; a única chamada remove é um teste NEGATIVO
 * do arquivo criado e finalizado nesta mesma execução, nunca uma foto existente.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { OBSERVATION_STORAGE } from '../../src/app/core/config/observation-storage';
import type { Observation, ObservationImageInsert } from '../../src/app/core/models/observation.model';

export interface StorageCheck { id: string; passed: boolean }
type StorageReplyError = { message: string; status?: number; statusCode?: string | number } | null;

export async function verifyObservationStorage(
  a: SupabaseClient,
  b: SupabaseClient,
  anonymous: SupabaseClient,
  aId: string,
  bId: string,
  fixture: Blob,
  onCheck?: (check: StorageCheck) => void,
): Promise<StorageCheck[]> {
  if (fixture.type !== 'image/png' || fixture.size <= 0 || fixture.size > 1024 * 1024) {
    throw new Error('Use somente a imagem PNG sintética de teste, menor que 1 MB.');
  }
  const checks: StorageCheck[] = [];
  const record = (id: string, passed: boolean): void => {
    const check = { id, passed }; checks.push(check); onCheck?.(check);
    if (!passed) throw new Error('Verificação interrompida; conservar resultados sem dados pessoais.');
  };
  const denied = (error: StorageReplyError): boolean =>
    !!error && [400, 401, 403, 404].includes(Number(error.status ?? error.statusCode));
  const originalBytes = new Uint8Array(await fixture.arrayBuffer());
  const sameImage = async (blob: Blob | null): Promise<boolean> => {
    if (!blob || blob.size !== fixture.size) return false;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return bytes.every((byte, index) => byte === originalBytes[index]);
  };
  const bucket = OBSERVATION_STORAGE.bucketId;
  const storageA = a.storage.from(bucket);
  const storageB = b.storage.from(bucket);
  const storageAnonymous = anonymous.storage.from(bucket);
  record('distinct-accounts', aId !== bId);
  const draft = await a.from('observations').insert({ photo_source: 'gallery' }).select('*').returns<Observation[]>().single();
  record('own-draft', !draft.error && draft.data?.user_id === aId && draft.data.lifecycle === 'draft' && draft.data.analysis_status === 'idle');
  if (!draft.data) return checks;
  const observationId = draft.data.id;
  const bDraft = await b.from('observations').insert({ photo_source: 'gallery' }).select('*').returns<Observation[]>().single();
  record('other-own-draft', !bDraft.error && bDraft.data?.user_id === bId);
  if (!bDraft.data) return checks;
  const bPath = `${bId}/${bDraft.data.id}/${crypto.randomUUID()}.png`;
  const bOwnUpload = await storageB.upload(bPath, fixture, { contentType: 'image/png', upsert: false });
  const bOwnDownload = await storageB.download(bPath);
  record('other-own-file', !bOwnUpload.error && !bOwnDownload.error && await sameImage(bOwnDownload.data));
  const aReadsB = await storageA.download(bPath);
  record('owner-cannot-read-other', denied(aReadsB.error));
  const imageId = crypto.randomUUID();
  const path = `${aId}/${observationId}/${imageId}.png`;
  const temporaryPath = (): string => `${aId}/${observationId}/${crypto.randomUUID()}.png`;
  const upload = await storageA.upload(path, fixture, { contentType: 'image/png', upsert: false });
  record('owner-upload', !upload.error && upload.data?.path === path);
  const download = await storageA.download(path);
  record('owner-download', !download.error && await sameImage(download.data));
  const bDownload = await storageB.download(path);
  record('other-download-denied', denied(bDownload.error));
  const bUpload = await storageB.upload(temporaryPath(), fixture, { contentType: 'image/png', upsert: false });
  record('other-upload-denied', denied(bUpload.error));
  const wrongObservation = await storageA.upload(`${aId}/${bDraft.data.id}/${crypto.randomUUID()}.png`, fixture, { contentType: 'image/png', upsert: false });
  record('foreign-observation-upload-denied', denied(wrongObservation.error));
  const shared = await storageA.upload(`shared/${observationId}/${crypto.randomUUID()}.png`, fixture, { contentType: 'image/png', upsert: false });
  record('shared-upload-denied', denied(shared.error));
  const anonDownload = await storageAnonymous.download(path);
  record('anonymous-download-denied', denied(anonDownload.error));
  const anonUpload = await storageAnonymous.upload(temporaryPath(), fixture, { contentType: 'image/png', upsert: false });
  record('anonymous-upload-denied', denied(anonUpload.error));

  const oversized = new Blob([fixture, new Uint8Array(OBSERVATION_STORAGE.maxBytes + 1 - fixture.size)], { type: 'image/png' });
  const oversizedReply = await storageA.upload(temporaryPath(), oversized, { contentType: 'image/png', upsert: false });
  record('oversize-rejected', !!oversizedReply.error && /size|large|exceed/i.test(oversizedReply.error.message));
  const wrongMime = await storageA.upload(temporaryPath(), new Blob(['DataBee synthetic fixture'], { type: 'text/plain' }), { contentType: 'text/plain', upsert: false });
  record('mime-rejected', !!wrongMime.error && /mime|content.type|file.type/i.test(wrongMime.error.message));

  const overwrite = await storageA.upload(path, fixture, { contentType: 'image/png', upsert: true });
  record('upsert-overwrite-denied', denied(overwrite.error));
  const directUpdate = await storageA.update(path, fixture, { contentType: 'image/png' });
  record('direct-update-denied', denied(directUpdate.error));
  const metadata: ObservationImageInsert = {
    id: imageId, observation_id: observationId, object_path: path,
    mime_type: 'image/png', bytes: fixture.size, photo_source: 'gallery',
  };
  const finalized = await a.from('observation_images').insert(metadata).select('id').single();
  record('metadata-finalized', !finalized.error && finalized.data?.id === imageId);
  const extraUpload = await storageA.upload(temporaryPath(), fixture, { contentType: 'image/png', upsert: false });
  record('upload-after-finalization-denied', denied(extraUpload.error));
  const finalizedUpdate = await storageA.update(path, fixture, { contentType: 'image/png' });
  record('finalized-update-denied', denied(finalizedUpdate.error));

  // Único alvo possível: o arquivo sintético criado acima e já finalizado.
  const attemptedDelete = await storageA.remove([path]);
  record('finalized-delete-blocked', denied(attemptedDelete.error) || (!attemptedDelete.error && attemptedDelete.data?.length === 0));
  const after = await storageA.download(path);
  record('finalized-file-preserved', !after.error && await sameImage(after.data));

  // URL fica apenas nesta variável, sem logs/relatório; fetch não envia sessão.
  const publicUrl = storageA.getPublicUrl(path).data.publicUrl;
  const publicReply = await fetch(publicUrl, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  record('public-url-denied', [400, 403, 404].includes(publicReply.status));
  return checks;
}

/** PNG criado no navegador; não usa foto pessoal, arquivo externo, EXIF ou GPS. */
export async function createStorageFixture(): Promise<Blob> {
  const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível preparar a imagem sintética.');
  context.fillStyle = '#f0aa12'; context.fillRect(0, 0, 16, 16);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob); else reject(new Error('Falha ao criar a imagem sintética.'));
  }, 'image/png'));
}
