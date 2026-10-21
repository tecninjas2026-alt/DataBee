import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile, ProfileInsert, ProfileOwnerUpdate } from '../../src/app/core/models/profile.model';
import cases from './profile-privacy.cases.json';

type Row<T> = { [Key in keyof T]: T[Key] };
type Database = {
  public: {
    Tables: {
      profiles: { Row: Row<Profile>; Insert: Row<ProfileInsert>; Update: Row<ProfileOwnerUpdate>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
type Client = SupabaseClient<Database>;
type Result = { id: string; status: 'Pass' | 'Fail' | 'Not run'; code?: string; reason?: string };
const results: Result[] = cases.map(({ id }) => ({ id, status: 'Not run' }));
const form = document.querySelector<HTMLFormElement>('#accounts');
const button = document.querySelector<HTMLButtonElement>('#run');
const summary = document.querySelector<HTMLElement>('#summary');
const list = document.querySelector<HTMLOListElement>('#results');
const download = document.querySelector<HTMLAnchorElement>('#download');
if (!form || !button || !summary || !list || !download) throw new Error('Ferramenta local incompleta.');
const rows = new Map<string, HTMLLIElement>();
for (const item of cases) {
  const row = document.createElement('li');
  row.textContent = `${item.title}: Not run`;
  rows.set(item.id, row);
  list.append(row);
}

function record(id: string, passed: boolean, code?: string, reason?: string): void {
  const result = results.find(item => item.id === id);
  const definition = cases.find(item => item.id === id);
  const row = rows.get(id);
  if (!result || !definition || !row) throw new Error('Caso desconhecido.');
  result.status = passed ? 'Pass' : 'Fail';
  if (code && /^[A-Z0-9]{5}$/.test(code)) result.code = code;
  if (reason) result.reason = reason;
  row.dataset['status'] = result.status;
  row.textContent = `${definition.title}: ${result.status}${result.code ? ` (${result.code})` : ''}`;
  if (!passed) throw new Error('Verificação interrompida. Confira os casos com Fail.');
}

function validProfile(profile: Profile | null, id: string): profile is Profile {
  return !!profile && profile.id === id && typeof profile.display_name === 'string' &&
    Array.from(profile.display_name).length >= 1 && Array.from(profile.display_name).length <= 80 &&
    Number.isFinite(Date.parse(profile.created_at));
}

const forgedInsert = (value: Record<string, unknown>) => value as unknown as ProfileInsert;
const forgedUpdate = (value: Record<string, unknown>) => value as unknown as ProfileOwnerUpdate;

async function matrix(a: Client, b: Client, anon: Client, aId: string, bId: string): Promise<void> {
  record('distinct', aId !== bId);
  const own = await a.from('profiles').select('*').eq('id', aId).single();
  record('profile-a', !own.error && validProfile(own.data, aId), own.error?.code);
  const original = own.data;
  if (!original) return;
  try {
    const other = await b.from('profiles').select('*').eq('id', bId).single();
    record('profile-b', !other.error && validProfile(other.data, bId), other.error?.code);
    const readB = await a.from('profiles').select('*').eq('id', bId).single();
    record('a-read-b', !readB.error && validProfile(readB.data, bId), readB.error?.code);
    const readA = await b.from('profiles').select('*').eq('id', aId).single();
    record('b-read-a', !readA.error && validProfile(readA.data, aId), readA.error?.code);
    record('minimal', [original, other.data, readB.data, readA.data].every(profile =>
      !!profile && Object.keys(profile).sort().join(',') === 'created_at,display_name,id'));

    for (const [id, name] of [['owner-update', 'Teste de perfil A'], ['name-min', 'A'], ['name-max', 'A'.repeat(80)]]) {
      const updated = await a.from('profiles').update({ display_name: name }).eq('id', aId).select('*').single();
      record(id, !updated.error && updated.data?.display_name === name && updated.data.created_at === original.created_at, updated.error?.code);
    }
    const invalidNames: Array<[string, unknown, string]> = [
      ['name-empty', '', '23514'], ['name-spaces', '   ', '23514'], ['name-whitespace', '\t\n', '23514'],
      ['name-long', 'A'.repeat(81), '23514'], ['name-null', null, '23502'],
    ];
    for (const [id, name, code] of invalidNames) {
      const rejected = await a.from('profiles').update(forgedUpdate({ display_name: name })).eq('id', aId).select('id');
      record(id, rejected.error?.code === code, rejected.error?.code);
    }
    const bUpdate = await b.from('profiles').update({ display_name: 'Tentativa de B' }).eq('id', aId).select('id');
    record('b-update-a', !bUpdate.error && bUpdate.data?.length === 0, bUpdate.error?.code);
    const unchanged = await a.from('profiles').select('*').eq('id', aId).single();
    record('a-unchanged', !unchanged.error && unchanged.data?.display_name === 'A'.repeat(80) && unchanged.data.created_at === original.created_at, unchanged.error?.code);

    // ON CONFLICT DO NOTHING evita que um erro de chave duplicada seja confundido com prova de RLS.
    const forged = await a.from('profiles').upsert({ id: bId, display_name: 'Tentativa de A' }, { onConflict: 'id', ignoreDuplicates: true });
    record('a-forges-b', forged.error?.code === '42501', forged.error?.code);
    for (const [id, patch] of [
      ['id-update', { id: bId }], ['date-update', { created_at: '2000-01-01T00:00:00Z' }],
    ] as const) {
      const rejected = await a.from('profiles').update(forgedUpdate(patch)).eq('id', aId).select('id');
      record(id, rejected.error?.code === '42501', rejected.error?.code);
    }
    const dateInsert = await a.from('profiles').upsert(forgedInsert({
      id: aId, display_name: 'Tentativa de data', created_at: '2000-01-01T00:00:00Z',
    }), { onConflict: 'id', ignoreDuplicates: true });
    record('date-insert', dateInsert.error?.code === '42501', dateInsert.error?.code);

    const repeat = await a.from('profiles').upsert({ id: aId, display_name: 'Não sobrescrever' }, { onConflict: 'id', ignoreDuplicates: true });
    const repeated = await a.from('profiles').select('*').eq('id', aId);
    record('repeat-profile', !repeat.error && !repeated.error && repeated.data?.length === 1 &&
      repeated.data[0].display_name === 'A'.repeat(80) && repeated.data[0].created_at === original.created_at, repeat.error?.code ?? repeated.error?.code);

    const anonRead = await anon.from('profiles').select('*');
    record('anon-read', anonRead.error?.code === '42501', anonRead.error?.code);
    const anonInsert = await anon.from('profiles').insert({ id: aId, display_name: 'Sem login' });
    record('anon-insert', anonInsert.error?.code === '42501', anonInsert.error?.code);
    const anonUpdate = await anon.from('profiles').update({ display_name: 'Sem login' }).eq('id', aId);
    record('anon-update', anonUpdate.error?.code === '42501', anonUpdate.error?.code);
    const anonDelete = await anon.from('profiles').delete().eq('id', aId).eq('id', bId);
    record('anon-delete', anonDelete.error?.code === '42501', anonDelete.error?.code);
    const ownerDelete = await a.from('profiles').delete().eq('id', aId).eq('id', bId);
    record('owner-delete', ownerDelete.error?.code === '42501', ownerDelete.error?.code);
  } finally {
    const restored = await a.from('profiles').update({ display_name: original.display_name }).eq('id', aId).select('*').single();
    record('restore-a', !restored.error && restored.data?.display_name === original.display_name && restored.data.created_at === original.created_at, restored.error?.code);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (button.disabled) return;
  void run();
});

async function run(): Promise<void> {
  if (!form || !button || !summary || !download) return;
  button.disabled = true;
  download.hidden = true;
  const clients: Client[] = [];
  for (const result of results) {
    result.status = 'Not run';
    delete result.code;
    delete result.reason;
    const row = rows.get(result.id);
    const definition = cases.find(item => item.id === result.id);
    if (row && definition) { row.textContent = `${definition.title}: Not run`; delete row.dataset['status']; }
  }
  summary.textContent = 'Verificando o banco real…';
  try {
    const config: { url: string; publishableKey: string } = await (await fetch('/config')).json();
    const client = (): Client => {
      const instance = createClient<Database>(config.url, config.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }) },
      });
      clients.push(instance);
      return instance;
    };
    const a = client(); const b = client(); const anon = client();
    const input = (id: string): string => {
      const element = document.getElementById(id);
      if (!(element instanceof HTMLInputElement)) throw new Error('Campo ausente.');
      return element.value;
    };
    const loginA = await a.auth.signInWithPassword({ email: input('a-email').trim(), password: input('a-password') });
    const reason = (code?: string): string => ['invalid_credentials', 'email_not_confirmed', 'over_request_rate_limit', 'user_banned'].includes(code ?? '') ? code ?? 'auth_unavailable' : 'auth_unavailable';
    record('auth-a', !loginA.error && !!loginA.data.user, undefined, loginA.error ? reason(loginA.error.code) : undefined);
    const loginB = await b.auth.signInWithPassword({ email: input('b-email').trim(), password: input('b-password') });
    record('auth-b', !loginB.error && !!loginB.data.user, undefined, loginB.error ? reason(loginB.error.code) : undefined);
    form.reset();
    if (loginA.data.user && loginB.data.user) await matrix(a, b, anon, loginA.data.user.id, loginB.data.user.id);
  } catch {
    summary.textContent = 'Verificação interrompida. Confira os casos com Fail e a conexão. Se falhou na entrada, confira os dados e a confirmação do e-mail da conta.';
  } finally {
    form.reset();
    await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
    const pass = results.filter(item => item.status === 'Pass').length;
    const fail = results.filter(item => item.status === 'Fail').length;
    const unrun = results.filter(item => item.status === 'Not run').length;
    summary.textContent += ` Resultado: ${pass} Pass · ${fail} Fail · ${unrun} Not run.`;
    try {
      const saved = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tests: results }) });
      if (!saved.ok) throw new Error('Relatório não salvo.');
      download.hidden = false;
    } catch { summary.textContent += ' Não foi possível salvar o relatório local.'; }
    button.disabled = false;
  }
}
