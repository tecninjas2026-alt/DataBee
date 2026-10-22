/** IMP-069: só IDs reservados no manifesto; nenhuma exclusão ou limpeza. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Observation, ObservationImage, ObservationPrivateLocation } from '../../src/app/core/models/observation.model';
import type { RecordCheck, SeedManifest, SeedSet, Step } from './test-data.types';

type Progress = (set: SeedSet, step: Step, state: 'pending' | 'confirmed') => Promise<void>;
type ReadResult<T> = { data: T | null; error: unknown };
function requireValue<T>(reply: ReadResult<T>): T | null {
  if (reply.error) throw new Error('Consulta não confirmada; retome com os mesmos IDs.');
  return reply.data;
}
function assert(value: boolean): asserts value {
  if (!value) throw new Error('Dados diferentes do manifesto; execução interrompida.');
}
const object = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;

export async function executeSeed(
  a: SupabaseClient, b: SupabaseClient, anonymous: SupabaseClient,
  manifest: SeedManifest, png: Blob, progress: Progress, record: RecordCheck,
): Promise<void> {
  const bytes = new Uint8Array(await png.arrayBuffer());
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  assert(digest === manifest.fixture.sha256 && png.size === manifest.fixture.bytes && png.type === 'image/png');
  const samePng = async (client: SupabaseClient, set: SeedSet): Promise<boolean> => {
    const reply = await client.storage.from(set.bucket).download(set.object_path);
    if (reply.error || !reply.data || reply.data.size !== bytes.length) return false;
    const downloaded = new Uint8Array(await reply.data.arrayBuffer());
    return downloaded.every((byte, index) => byte === bytes[index]);
  };
  const observation = async (client: SupabaseClient, set: SeedSet): Promise<Observation | null> =>
    requireValue(await client.from('observations').select('*').eq('id', set.observation_id).returns<Observation[]>().maybeSingle());
  const location = async (client: SupabaseClient, set: SeedSet): Promise<ObservationPrivateLocation | null> =>
    requireValue(await client.from('observation_private_locations').select('*').eq('observation_id', set.observation_id).returns<ObservationPrivateLocation[]>().maybeSingle());
  const image = async (client: SupabaseClient, set: SeedSet): Promise<ObservationImage | null> =>
    requireValue(await client.from('observation_images').select('*').eq('observation_id', set.observation_id).returns<ObservationImage[]>().maybeSingle());
  const validObservation = (row: Observation | null, set: SeedSet): boolean => !!row &&
    row.id === set.observation_id && row.user_id === set.owner_id && row.photo_source === 'gallery' &&
    row.lifecycle === 'draft' && row.publication === 'private' && row.analysis_status === 'idle' &&
    row.captured_at === null && row.curation_status === null && row.analysis_started_at === null && row.public_region_label === null;
  const validLocation = (row: ObservationPrivateLocation | null, set: SeedSet): boolean => !!row &&
    row.observation_id === set.observation_id && row.owner_id === set.owner_id && row.latitude === 0 &&
    row.longitude === set.synthetic_location.longitude && row.location_source === 'user_informed' && row.accuracy === null && row.consent_at === null;
  const validImage = (row: ObservationImage | null, set: SeedSet): boolean => !!row &&
    row.id === set.image_id && row.observation_id === set.observation_id && row.owner_id === set.owner_id &&
    row.object_path === set.object_path && row.mime_type === 'image/png' && row.bytes === png.size && row.photo_source === 'gallery' && row.position === 0;
  const listedFile = async (client: SupabaseClient, set: SeedSet): Promise<Record<string, unknown> | null> => {
    const reply = await client.storage.from(set.bucket).list(`${set.owner_id}/${set.observation_id}`, { search: `${set.image_id}.png`, limit: 100 });
    const files = requireValue(reply);
    if (!files) throw new Error('Listagem não confirmada.');
    const found = files.find(file => file.name === `${set.image_id}.png`);
    if (!found) return null;
    // list confirma existência; info devolve a etiqueta customizada e o MIME real.
    const info = requireValue(await client.storage.from(set.bucket).info(set.object_path));
    if (!info) throw new Error('Informações do PNG não confirmadas.');
    return object(info);
  };
  const validLabel = (file: Record<string, unknown> | null): boolean => {
    // O SDK converte recursivamente snake_case para camelCase no retorno de info.
    const label = object(file?.['metadata']);
    return label?.['datasetLabel'] === 'TEST DATA' && label['runId'] === manifest.run_id &&
      file?.['size'] === png.size && file['contentType'] === 'image/png';
  };
  const ensure = async (
    set: SeedSet, step: Step, read: () => Promise<boolean | null>, write: () => Promise<{ error: unknown }>,
  ): Promise<void> => {
    // Reconciliar antes de qualquer repetição; null = ausência confirmada, false = conflito.
    let present = await read();
    assert(present !== false);
    if (present === null) {
      assert(set.progress[step] !== 'confirmed');
      await progress(set, step, 'pending');
      await write();
      // Mesmo após erro HTTP/rede, só a releitura pelo ID reservado decide o resultado.
      present = await read();
      if (present !== true) {
        throw new Error('Escrita não confirmada. Não criar outros IDs; retome esta execução.');
      }
    }
    await progress(set, step, 'confirmed');
    set.progress[step] = 'confirmed';
  };
  const create = async (client: SupabaseClient, set: SeedSet): Promise<void> => {
    await ensure(set, 'observation', async () => {
      const row = await observation(client, set); return row ? validObservation(row, set) : null;
    }, async () => await client.from('observations').insert({ id: set.observation_id, photo_source: 'gallery' }));
    await ensure(set, 'location', async () => {
      const row = await location(client, set); return row ? validLocation(row, set) : null;
    }, async () => await client.from('observation_private_locations').insert({ observation_id: set.observation_id, ...set.synthetic_location }));
    await ensure(set, 'upload', async () => {
      const file = await listedFile(client, set);
      return file ? validLabel(file) && await samePng(client, set) : null;
    }, async () => await client.storage.from(set.bucket).upload(set.object_path, png, {
      contentType: 'image/png', upsert: false, metadata: { dataset_label: 'TEST DATA', run_id: manifest.run_id },
    }));
    await ensure(set, 'metadata', async () => {
      const row = await image(client, set); return row ? validImage(row, set) : null;
    }, async () => await client.from('observation_images').insert({
      id: set.image_id, observation_id: set.observation_id, object_path: set.object_path,
      mime_type: 'image/png', bytes: png.size, photo_source: 'gallery',
    }));
  };
  const [setA, setB] = manifest.sets;
  await create(a, setA); record('a-created', true);
  await create(b, setB); record('b-created', true);
  const intact = async (client: SupabaseClient, set: SeedSet): Promise<boolean> =>
    validObservation(await observation(client, set), set) && validLocation(await location(client, set), set) &&
    validImage(await image(client, set), set) && validLabel(await listedFile(client, set)) && await samePng(client, set);
  record('a-reads-own', await intact(a, setA));
  record('b-reads-own', await intact(b, setB));
  record('b-cannot-read-a', await observation(b, setA) === null && await location(b, setA) === null && await image(b, setA) === null);
  const storageDenied = (error: unknown): boolean => {
    const value = object(error);
    const statusCode = Number(value?.['statusCode']);
    const status = Number.isFinite(statusCode) ? statusCode : Number(value?.['status']);
    // Só respostas explícitas de acesso/objeto oculto; erros de rede não contam.
    return !!value && ([401, 403, 404].includes(status) ||
      status === 400 && ['not_found', 'NoSuchKey', 'AccessDenied'].includes(String(value['code'] ?? value['statusCode'])));
  };
  record('b-cannot-download-a', storageDenied((await b.storage.from(setA.bucket).download(setA.object_path)).error));
  const updateDenied = (reply: { error: { code?: string } | null; data: unknown[] | null }): boolean =>
    reply.error?.code === '42501' || !reply.error && Array.isArray(reply.data) && reply.data.length === 0;
  // Alterações só no conjunto artificial A. Se a proteção falhar, parar sem "corrigir" ou apagar.
  record('b-cannot-update-draft', updateDenied(await b.from('observations').update({ captured_at: '2000-01-01T00:00:00Z' }).eq('id', setA.observation_id).select('id')));
  record('b-cannot-update-location', updateDenied(await b.from('observation_private_locations').update({ longitude: 2 }).eq('observation_id', setA.observation_id).select('observation_id')));
  record('b-cannot-update-image', updateDenied(await b.from('observation_images').update({ bytes: png.size + 1 }).eq('id', setA.image_id).select('id')));
  record('b-cannot-replace-png', storageDenied((await b.storage.from(setA.bucket).update(setA.object_path, png, { contentType: 'image/png' })).error));
  const anonRows = await Promise.all([
    anonymous.from('observations').select('id').eq('id', setA.observation_id),
    anonymous.from('observation_private_locations').select('observation_id').eq('observation_id', setA.observation_id),
    anonymous.from('observation_images').select('id').eq('id', setA.image_id),
  ]);
  record('anon-cannot-read', anonRows.every(updateDenied));
  record('anon-cannot-download', storageDenied((await anonymous.storage.from(setA.bucket).download(setA.object_path)).error));
  record('a-preserved', await intact(a, setA));
  record('b-preserved', await intact(b, setB));
}
