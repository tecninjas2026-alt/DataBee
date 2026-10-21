import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Observation,
  ObservationDraftInsert,
  ObservationOwnerUpdate,
  ObservationPrivateLocation,
  ObservationPrivateLocationInsert,
  ObservationPrivateLocationUpdate,
} from '../../src/app/core/models/observation.model';
import cases from './observation-privacy.cases.json';

type Row<T> = { [Key in keyof T]: T[Key] };
type Table<R, I, U> = { Row: R; Insert: I; Update: U; Relationships: [] };
type Database = {
  public: {
    Tables: {
      observations: Table<Row<Observation>, Row<ObservationDraftInsert>, Row<ObservationOwnerUpdate>>;
      observation_private_locations: Table<
        Row<ObservationPrivateLocation>, Row<ObservationPrivateLocationInsert>, ObservationPrivateLocationUpdate
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
type Client = SupabaseClient<Database>;
type Status = 'Pass' | 'Fail' | 'Not run';
const authMessages = {
  invalid_credentials: 'E-mail ou senha não foram aceitos. Confira os dados da conta de teste.',
  email_not_confirmed: 'O e-mail desta conta ainda precisa ser confirmado no Supabase.',
  over_request_rate_limit: 'Muitas tentativas de entrada. Aguarde um pouco e tente novamente.',
  user_banned: 'Esta conta está bloqueada no Supabase.',
  auth_unavailable: 'A entrada não pôde ser concluída. Confira a conexão e a conta no Supabase.',
} as const;
type AuthReason = keyof typeof authMessages;
type Result = { id: string; status: Status; code?: string; reason?: AuthReason };
type Reply = { data: unknown; error: { code?: string } | null };
const results: Result[] = cases.map(({ id }) => ({ id, status: 'Not run' }));
const rows = new Map<string, HTMLLIElement>();
const form = document.querySelector<HTMLFormElement>('#accounts');
const runButton = document.querySelector<HTMLButtonElement>('#run');
const summary = document.querySelector<HTMLElement>('#summary');
const list = document.querySelector<HTMLOListElement>('#results');
const download = document.querySelector<HTMLAnchorElement>('#download');
if (!form || !runButton || !summary || !list || !download) throw new Error('Cliente local incompleto.');

for (const item of cases) {
  const row = document.createElement('li');
  row.textContent = `${item.title}: Not run`;
  rows.set(item.id, row);
  list.append(row);
}

function record(id: string, passed: boolean, code?: string, reason?: AuthReason): void {
  const result = results.find(item => item.id === id);
  const definition = cases.find(item => item.id === id);
  const row = rows.get(id);
  if (!result || !definition || !row) throw new Error('Caso desconhecido.');
  result.status = passed ? 'Pass' : 'Fail';
  if (code && /^[A-Z0-9]{5}$/.test(code)) result.code = code;
  if (reason) result.reason = reason;
  row.textContent = `${definition.title}: ${result.status}${result.code ? ` (${result.code})` : ''}${reason ? ` — ${authMessages[reason]}` : ''}`;
  row.dataset['status'] = result.status;
  if (!passed) throw new Error('Teste falhou; demais casos não serão executados.');
}

function authReason(code?: string): AuthReason {
  return code && Object.hasOwn(authMessages, code) ? code as AuthReason : 'auth_unavailable';
}

function permissionDenied(reply: Reply): boolean {
  return reply.error?.code === '42501' || (!reply.error && Array.isArray(reply.data) && reply.data.length === 0);
}

function inputValue(id: string): string {
  const input = document.getElementById(id);
  if (!(input instanceof HTMLInputElement)) throw new Error('Campo ausente.');
  return input.value;
}

// Somente os testes negativos burlam o tipo do INSERT/UPDATE para provar a proteção no banco.
const forgedDraft = (value: Record<string, unknown>) => value as unknown as ObservationDraftInsert;
const forgedUpdate = (value: Record<string, unknown>) => value as unknown as ObservationOwnerUpdate;

async function matrix(a: Client, b: Client, anonymous: Client, aId: string, bId: string): Promise<void> {
  record('distinct', aId !== bId);
  const created = await a.from('observations').insert({ photo_source: 'gallery' }).select('*').single();
  const observation = created.data;
  record('draft', !created.error && !!observation && observation.user_id === aId &&
    observation.lifecycle === 'draft' && observation.publication === 'private' &&
    observation.analysis_status === 'idle' && observation.curation_status === null &&
    observation.analysis_started_at === null && observation.captured_at === null &&
    Number.isFinite(Date.parse(observation.created_at)), created.error?.code);
  if (!observation) return;
  const observationId = observation.id;
  const own = await a.from('observations').select('*').eq('id', observationId);
  record('read-own', !own.error && own.data?.length === 1 && own.data[0]?.id === observationId, own.error?.code);
  const gpsColumns = ['latitude', 'longitude', 'accuracy', 'location_source', 'consent_at'];
  record('no-gps-columns', gpsColumns.every(column => !Object.hasOwn(observation, column)));

  const location: ObservationPrivateLocationInsert = {
    observation_id: observationId, latitude: 0, longitude: 0, accuracy: 5,
    location_source: 'device_gps', consent_at: new Date().toISOString(),
  };
  const insertedLocation = await a.from('observation_private_locations').insert(location).select('*').single();
  const readLocation = await a.from('observation_private_locations').select('*').eq('observation_id', observationId);
  const ownLocation = readLocation.data?.[0];
  record('location', !insertedLocation.error && !readLocation.error && readLocation.data?.length === 1 &&
    ownLocation?.owner_id === aId && ownLocation?.location_source === 'device_gps' &&
    ownLocation.latitude === location.latitude && ownLocation.longitude === location.longitude &&
    ownLocation.accuracy === 5 && !!ownLocation.consent_at,
    insertedLocation.error?.code ?? readLocation.error?.code);

  const withoutLocation = await a.from('observations').insert({ photo_source: 'gallery' }).select('*').single();
  const withoutId = withoutLocation.data?.id;
  if (!withoutId) { record('without-location', false, withoutLocation.error?.code); return; }
  const absentLocation = await a.from('observation_private_locations').select('observation_id').eq('observation_id', withoutId);
  record('without-location', !withoutLocation.error && !absentLocation.error && absentLocation.data?.length === 0 &&
    withoutLocation.data?.captured_at === null, withoutLocation.error?.code ?? absentLocation.error?.code);

  const bCreated = await b.from('observations').insert({ photo_source: 'gallery' }).select('*').single();
  record('b-own', !bCreated.error && bCreated.data?.user_id === bId && bCreated.data.lifecycle === 'draft', bCreated.error?.code);
  if (!bCreated.data) return;
  const aReadsB = await a.from('observations').select('id').eq('id', bCreated.data.id);
  record('a-read-b', permissionDenied(aReadsB), aReadsB.error?.code);

  const bObservation = await b.from('observations').select('*').eq('id', observationId);
  record('b-read-observation', permissionDenied(bObservation), bObservation.error?.code);
  const bLocation = await b.from('observation_private_locations').select('*').eq('observation_id', observationId);
  record('b-read-location', permissionDenied(bLocation), bLocation.error?.code);
  const bUpdate = await b.from('observations').update({ captured_at: new Date().toISOString() }).eq('id', observationId).select('id');
  record('b-update-observation', permissionDenied(bUpdate), bUpdate.error?.code);
  const bUpdateLocation = await b.from('observation_private_locations').update({ accuracy: 9 }).eq('observation_id', observationId).select('observation_id');
  record('b-update-location', permissionDenied(bUpdateLocation), bUpdateLocation.error?.code);
  const afterObservation = await a.from('observations').select('captured_at').eq('id', observationId).single();
  const afterLocation = await a.from('observation_private_locations').select('accuracy').eq('observation_id', observationId).single();
  record('unchanged', !afterObservation.error && !afterLocation.error &&
    afterObservation.data?.captured_at === null && afterLocation.data?.accuracy === 5);

  const anonObservation = await anonymous.from('observations').select('*').eq('id', observationId);
  record('anon-observation', anonObservation.error?.code === '42501', anonObservation.error?.code);
  const anonLocation = await anonymous.from('observation_private_locations').select('*').eq('observation_id', observationId);
  record('anon-location', anonLocation.error?.code === '42501', anonLocation.error?.code);
  const anonInsert = await anonymous.from('observations').insert({ photo_source: 'gallery' }).select('id');
  record('anon-insert', anonInsert.error?.code === '42501', anonInsert.error?.code);
  const anonUpdate = await anonymous.from('observations').update({ captured_at: null }).eq('id', observationId).select('id');
  record('anon-update', anonUpdate.error?.code === '42501', anonUpdate.error?.code);
  const anonInsertLocation = await anonymous.from('observation_private_locations').insert({ ...location, observation_id: withoutId }).select('observation_id');
  record('anon-insert-location', anonInsertLocation.error?.code === '42501', anonInsertLocation.error?.code);
  const anonUpdateLocation = await anonymous.from('observation_private_locations').update({ accuracy: 7 }).eq('observation_id', observationId).select('observation_id');
  record('anon-update-location', anonUpdateLocation.error?.code === '42501', anonUpdateLocation.error?.code);

  const invalidLocations: Array<[string, Record<string, unknown>]> = [
    ['latitude', { latitude: 91 }], ['longitude', { longitude: 181 }],
    ['latitude-low', { latitude: -91 }], ['longitude-low', { longitude: -181 }],
    ['accuracy', { accuracy: -1 }], ['source', { location_source: 'unknown' }],
    ['consent', { consent_at: null }],
  ];
  for (const [id, patch] of invalidLocations) {
    const reply = await a.from('observation_private_locations')
      .update(patch as ObservationPrivateLocationUpdate).eq('observation_id', observationId).select('observation_id');
    record(id, reply.error?.code === '23514', reply.error?.code);
  }

  for (const accuracy of [null, 0, 5]) {
    const reply = await a.from('observation_private_locations').update({ accuracy }).eq('observation_id', observationId).select('accuracy').single();
    record(`accuracy-${accuracy === null ? 'null' : accuracy === 0 ? 'zero' : 'restore'}`,
      !reply.error && reply.data?.accuracy === accuracy, reply.error?.code);
  }
  const captureTime = new Date().toISOString(); // Data sintética de teste, não uma foto real.
  const ownUpdate = await a.from('observations').update({ captured_at: captureTime }).eq('id', observationId).select('captured_at').single();
  record('own-update', !ownUpdate.error && !!ownUpdate.data?.captured_at &&
    Date.parse(ownUpdate.data.captured_at) === Date.parse(captureTime), ownUpdate.error?.code);

  const forgedOwner = await a.from('observations').insert({ photo_source: 'gallery', user_id: bId }).select('id');
  record('forge-owner', forgedOwner.error?.code === '42501', forgedOwner.error?.code);
  const mismatchedOwner = await a.from('observation_private_locations')
    .insert({ ...location, observation_id: withoutId, owner_id: bId }).select('observation_id');
  record('location-owner', mismatchedOwner.error?.code === '42501', mismatchedOwner.error?.code);
  const bMismatchedOwner = await b.from('observation_private_locations')
    .insert({ ...location, observation_id: withoutId, owner_id: bId }).select('observation_id');
  record('b-location-owner', bMismatchedOwner.error?.code === '42501', bMismatchedOwner.error?.code);

  const protectedFields: Record<string, unknown> = {
    lifecycle: 'saved', publication: 'published', analysis_status: 'completed', curation_status: 'validated',
    analysis_started_at: new Date().toISOString(), public_region_label: 'Curitiba — PR', created_at: new Date().toISOString(),
  };
  for (const [field, value] of Object.entries(protectedFields)) {
    const reply = await a.from('observations').insert(forgedDraft({ photo_source: 'gallery', [field]: value })).select('id');
    record(`insert-${field}`, reply.error?.code === '42501', reply.error?.code);
  }
  for (const [field, value] of Object.entries(protectedFields)) {
    const reply = await a.from('observations').update(forgedUpdate({ [field]: value })).eq('id', observationId).select('id');
    record(`update-${field}`, reply.error?.code === '42501', reply.error?.code);
  }

  const transferObservation = await a.from('observations').update(forgedUpdate({ user_id: bId })).eq('id', observationId).select('id');
  record('update-owner', transferObservation.error?.code === '42501', transferObservation.error?.code);
  const transferLocation = await a.from('observation_private_locations')
    .update({ owner_id: bId } as unknown as ObservationPrivateLocationUpdate).eq('observation_id', observationId).select('observation_id');
  record('update-location-owner', transferLocation.error?.code === '42501', transferLocation.error?.code);
  const relinkLocation = await a.from('observation_private_locations')
    .update({ observation_id: withoutId } as unknown as ObservationPrivateLocationUpdate).eq('observation_id', observationId).select('observation_id');
  record('update-location-observation', relinkLocation.error?.code === '42501', relinkLocation.error?.code);

  for (const [label, client] of [['a', a], ['b', b], ['anon', anonymous]] as const) {
    // Filtro contraditório: nenhuma linha pode ser apagada, mesmo se houver grant indevido.
    // A ausência de grant DELETE deve retornar 42501 antes de avaliar as linhas.
    const observationDelete = await client.from('observations').delete().eq('id', observationId).neq('id', observationId);
    record(`delete-${label}-observation`, observationDelete.error?.code === '42501', observationDelete.error?.code);
    const locationDelete = await client.from('observation_private_locations').delete().eq('observation_id', observationId).neq('observation_id', observationId);
    record(`delete-${label}-location`, locationDelete.error?.code === '42501', locationDelete.error?.code);
  }
  const finalObservation = await a.from('observations').select('*').eq('id', observationId).single();
  const finalLocation = await a.from('observation_private_locations').select('*').eq('observation_id', observationId).single();
  record('final-integrity', !finalObservation.error && !finalLocation.error &&
    finalObservation.data?.user_id === aId && finalObservation.data.lifecycle === 'draft' &&
    finalObservation.data.publication === 'private' && finalObservation.data.analysis_status === 'idle' &&
    finalObservation.data.curation_status === null && finalObservation.data.analysis_started_at === null &&
    finalObservation.data.public_region_label === null && finalObservation.data.created_at === observation.created_at &&
    !!finalObservation.data.captured_at && Date.parse(finalObservation.data.captured_at) === Date.parse(captureTime) &&
    finalLocation.data?.owner_id === aId && finalLocation.data.observation_id === observationId &&
    finalLocation.data.latitude === location.latitude && finalLocation.data.longitude === location.longitude && finalLocation.data.accuracy === 5);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (runButton.disabled) return;
  runButton.disabled = true;
  download.hidden = true;
  summary.textContent = 'Executando testes reais. Nenhum dado pessoal será incluído no relatório.';
  for (const result of results) {
    result.status = 'Not run'; delete result.code; delete result.reason;
    const row = rows.get(result.id);
    const definition = cases.find(item => item.id === result.id);
    if (row && definition) { row.textContent = `${definition.title}: Not run`; delete row.dataset['status']; }
  }
  const clients: Client[] = [];
  let interrupted = false;
  try {
    const configResponse = await fetch('/config', { cache: 'no-store' });
    if (!configResponse.ok) throw new Error('Configuração indisponível.');
    const config: unknown = await configResponse.json();
    if (!config || typeof config !== 'object' || !('url' in config) || !('publishableKey' in config) ||
      typeof config.url !== 'string' || typeof config.publishableKey !== 'string' ||
      !config.publishableKey.startsWith('sb_publishable_')) throw new Error('Configuração pública inválida.');
    for (const label of ['a', 'b', 'anonymous']) {
      clients.push(createClient<Database>(config.url, config.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `databee-check-${label}-${crypto.randomUUID()}` },
      }));
    }
    const [a, b, anonymous] = clients;
    if (!a || !b || !anonymous) throw new Error('Clientes indisponíveis.');
    const authA = await a.auth.signInWithPassword({ email: inputValue('a-email').trim(), password: inputValue('a-password') });
    record('auth-a', !authA.error && !!authA.data.user, undefined, authA.error ? authReason(authA.error.code) : undefined);
    const authB = await b.auth.signInWithPassword({ email: inputValue('b-email').trim(), password: inputValue('b-password') });
    record('auth-b', !authB.error && !!authB.data.user, undefined, authB.error ? authReason(authB.error.code) : undefined);
    if (!authA.data.user || !authB.data.user) throw new Error('Autenticação incompleta.');
    for (const input of form.querySelectorAll<HTMLInputElement>('input')) input.value = '';
    await matrix(a, b, anonymous, authA.data.user.id, authB.data.user.id);
  } catch {
    interrupted = true;
  } finally {
    for (const input of form.querySelectorAll<HTMLInputElement>('input')) input.value = '';
    await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
    const passed = results.filter(result => result.status === 'Pass').length;
    const failed = results.filter(result => result.status === 'Fail').length;
    summary.textContent = `${passed}/${results.length} Pass; ${failed} Fail; ${results.length - passed - failed} Not run.${interrupted ? ' Execução interrompida; os casos não executados não comprovam proteção.' : ''}`;
    try {
      const response = await fetch('/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tests: results }),
      });
      if (!response.ok) throw new Error('Relatório não salvo.');
      download.href = '/report';
      download.hidden = false;
      summary.textContent += ' Relatório sanitizado salvo neste computador.';
    } catch {
      summary.textContent += ' Não foi possível salvar o relatório local.';
    }
    runButton.disabled = false;
  }
});
