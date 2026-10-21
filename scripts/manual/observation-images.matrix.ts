/** IMP-014 — roteiro SDK manual preparado; executar só após revisão/aplicação autorizada.
 * Recebe clientes A/B/anon já autenticados na ferramenta local, sem credenciais no código.
 * Cria dois rascunhos e dois metadados sintéticos; não envia arquivo nem apaga dados.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Observation, ObservationImage, ObservationImageInsert } from '../../src/app/core/models/observation.model';

export interface ImageMetadataCheck {
  id: string;
  passed: boolean;
  code?: string;
}

export async function verifyObservationImageMetadata(
  a: SupabaseClient,
  b: SupabaseClient,
  anonymous: SupabaseClient,
  aId: string,
  bId: string,
  onCheck?: (check: ImageMetadataCheck) => void,
): Promise<ImageMetadataCheck[]> {
  const checks: ImageMetadataCheck[] = [];
  const record = (id: string, passed: boolean, code?: string): void => {
    const check = { id, passed, ...(code && /^[A-Z0-9]{5}$/.test(code) ? { code } : {}) };
    checks.push(check);
    onCheck?.(check);
    if (!passed) throw new Error('Verificação interrompida; conservar resultados sem dados pessoais.');
  };
  const denied = (code?: string): boolean => code === '42501';
  record('distinct-accounts', aId !== bId);
  const aDraft = await a.from('observations').insert({ photo_source: 'gallery' }).select('*').returns<Observation[]>().single();
  record('a-draft', !aDraft.error && aDraft.data?.user_id === aId && aDraft.data.lifecycle === 'draft' && aDraft.data.analysis_status === 'idle', aDraft.error?.code);
  const bDraft = await b.from('observations').insert({ photo_source: 'camera' }).select('*').returns<Observation[]>().single();
  record('b-draft', !bDraft.error && bDraft.data?.user_id === bId, bDraft.error?.code);
  if (!aDraft.data || !bDraft.data) return checks;
  const aObservationId = aDraft.data.id;
  const bObservationId = bDraft.data.id;
  const metadata = (owner: string, observation: string, source: 'camera' | 'gallery'): ObservationImageInsert => {
    const id = crypto.randomUUID();
    return { id, observation_id: observation, object_path: `${owner}/${observation}/${id}.jpg`, mime_type: 'image/jpeg', bytes: 32, photo_source: source };
  };
  const own = metadata(aId, aObservationId, 'gallery');
  const inserted = await a.from('observation_images').insert(own).select('*').returns<ObservationImage[]>().single();
  const image = inserted.data;
  record('own-image', !inserted.error && !!image && image.owner_id === aId && image.observation_id === aObservationId && image.position === 0 && image.photo_source === 'gallery' && Number.isFinite(Date.parse(image.created_at)), inserted.error?.code);
  if (!image) return checks;
  const expectedColumns = ['id', 'observation_id', 'owner_id', 'object_path', 'mime_type', 'bytes', 'position', 'created_at', 'photo_source'].sort().join(',');
  record('metadata-only', Object.keys(image).sort().join(',') === expectedColumns && image.object_path === own.object_path && image.mime_type === 'image/jpeg' && image.bytes === 32);
  const second = await a.from('observation_images').insert(metadata(aId, aObservationId, 'gallery'));
  record('second-image-rejected', second.error?.code === '23505', second.error?.code);
  const otherObservation = await a.from('observation_images').insert(metadata(aId, bObservationId, 'camera'));
  record('foreign-observation-rejected', denied(otherObservation.error?.code), otherObservation.error?.code);
  const forgedOwner = await a.from('observation_images').insert({ ...metadata(bId, bObservationId, 'camera'), owner_id: bId });
  record('forged-owner-rejected', denied(forgedOwner.error?.code), forgedOwner.error?.code);
  const bRead = await b.from('observation_images').select('*').eq('id', image.id);
  record('b-cannot-read-a', !bRead.error && bRead.data?.length === 0, bRead.error?.code);
  const bUpdate = await b.from('observation_images').update({ object_path: 'rejected.jpg' }).eq('id', image.id);
  record('b-cannot-update-a', denied(bUpdate.error?.code), bUpdate.error?.code);
  const ownUpdate = await a.from('observation_images').update({ bytes: 64 }).eq('id', image.id);
  record('owner-cannot-update', denied(ownUpdate.error?.code), ownUpdate.error?.code);
  const pathUpdate = await a.from('observation_images').update({ object_path: 'rejected.jpg' }).eq('id', image.id);
  record('owner-cannot-update-path', denied(pathUpdate.error?.code), pathUpdate.error?.code);
  const reread = await a.from('observation_images').select('*').eq('id', image.id).returns<ObservationImage[]>().single();
  record('metadata-unchanged', !reread.error && reread.data?.object_path === own.object_path && reread.data.bytes === 32, reread.error?.code);
  const bImage = await b.from('observation_images').insert(metadata(bId, bObservationId, 'camera')).select('*').returns<ObservationImage[]>().single();
  record('b-own-image', !bImage.error && bImage.data?.owner_id === bId && bImage.data.photo_source === 'camera', bImage.error?.code);
  const anonRead = await anonymous.from('observation_images').select('*');
  record('anonymous-read-denied', denied(anonRead.error?.code), anonRead.error?.code);
  const anonInsert = await anonymous.from('observation_images').insert(metadata(aId, aObservationId, 'gallery'));
  record('anonymous-insert-denied', denied(anonInsert.error?.code), anonInsert.error?.code);
  // Filtros incompatíveis evitam exclusão mesmo se uma permissão estiver incorreta.
  const ownerDelete = await a.from('observation_images').delete().eq('id', image.id).neq('id', image.id);
  record('owner-delete-denied', denied(ownerDelete.error?.code), ownerDelete.error?.code);
  const anonDelete = await anonymous.from('observation_images').delete().eq('id', image.id).neq('id', image.id);
  record('anonymous-delete-denied', denied(anonDelete.error?.code), anonDelete.error?.code);
  return checks;
}
