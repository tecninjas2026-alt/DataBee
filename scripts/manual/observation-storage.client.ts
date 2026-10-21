import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyObservationStorage, createStorageFixture } from './observation-storage.matrix';
import cases from './observation-storage.cases.json';

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
  const row = document.createElement('li'); row.textContent = `${item.title}: Not run`;
  rows.set(item.id, row); list.append(row);
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
  if (!passed) throw new Error('Verificação interrompida.');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!button.disabled) void run();
});

async function run(): Promise<void> {
  if (!form || !button || !summary || !download) return;
  button.disabled = true; download.hidden = true;
  const clients: SupabaseClient[] = [];
  for (const result of results) {
    result.status = 'Not run'; delete result.code; delete result.reason;
    const row = rows.get(result.id); const definition = cases.find(item => item.id === result.id);
    if (row && definition) { row.textContent = `${definition.title}: Not run`; delete row.dataset['status']; }
  }
  summary.textContent = 'Verificando o armazenamento privado…';
  try {
    const config: { url: string; publishableKey: string } = await (await fetch('/config')).json();
    const client = (): SupabaseClient => {
      const instance = createClient(config.url, config.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }) },
      });
      clients.push(instance); return instance;
    };
    const a = client(); const b = client(); const anonymous = client();
    const input = (id: string): string => {
      const element = document.getElementById(id);
      if (!(element instanceof HTMLInputElement)) throw new Error('Campo ausente.');
      return element.value;
    };
    const reason = (code?: string): string => ['invalid_credentials', 'email_not_confirmed', 'over_request_rate_limit', 'user_banned'].includes(code ?? '') ? code ?? 'auth_unavailable' : 'auth_unavailable';
    const loginA = await a.auth.signInWithPassword({ email: input('a-email').trim(), password: input('a-password') });
    record('auth-a', !loginA.error && !!loginA.data.user, undefined, loginA.error ? reason(loginA.error.code) : undefined);
    const loginB = await b.auth.signInWithPassword({ email: input('b-email').trim(), password: input('b-password') });
    record('auth-b', !loginB.error && !!loginB.data.user, undefined, loginB.error ? reason(loginB.error.code) : undefined);
    form.reset();
    if (loginA.data.user && loginB.data.user) {
      const fixture = await createStorageFixture();
      await verifyObservationStorage(a, b, anonymous, loginA.data.user.id, loginB.data.user.id, fixture,
        check => record(check.id, check.passed));
    }
    summary.textContent = 'Verificação concluída.';
  } catch {
    summary.textContent = 'Verificação interrompida. Confira os casos com Fail. Se falhou na entrada, confira a conexão, os dados da conta e a confirmação do e-mail.';
  } finally {
    form.reset();
    await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
    const pass = results.filter(item => item.status === 'Pass').length;
    const fail = results.filter(item => item.status === 'Fail').length;
    const unrun = results.filter(item => item.status === 'Not run').length;
    summary.textContent += ` Resultado: ${pass} Pass · ${fail} Fail · ${unrun} Not run.`;
    try {
      const response = await fetch('/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tests: results }) });
      if (!response.ok) throw new Error('Relatório não salvo.');
      download.hidden = false;
    } catch { summary.textContent += ' Não foi possível salvar o relatório local.'; }
    button.disabled = false;
  }
}
