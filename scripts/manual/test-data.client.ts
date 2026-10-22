import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { executeSeed } from './test-data.matrix';
import type { SeedManifest, SeedSet, Step } from './test-data.types';
import cases from './test-data.cases.json';

type Result = { id: string; status: 'Pass' | 'Fail' | 'Not run'; reason?: string };
const form = document.querySelector<HTMLFormElement>('#accounts');
const button = document.querySelector<HTMLButtonElement>('#run');
const summary = document.querySelector<HTMLElement>('#summary');
const project = document.querySelector<HTMLElement>('#project');
const list = document.querySelector<HTMLOListElement>('#results');
const download = document.querySelector<HTMLAnchorElement>('#download');
if (!form || !button || !summary || !project || !list || !download) throw new Error('Ferramenta incompleta.');
const results: Result[] = cases.map(({ id }) => ({ id, status: 'Not run' }));
const rows = new Map<string, HTMLLIElement>();
for (const item of cases) {
  const row = document.createElement('li'); rows.set(item.id, row); list.append(row);
}
function render(): void {
  for (const item of cases) {
    const row = rows.get(item.id); const result = results.find(result => result.id === item.id);
    if (row && result) { row.textContent = `${item.title}: ${result.status}`; row.dataset['status'] = result.status; }
  }
}
function record(id: string, passed: boolean, reason?: string): void {
  const result = results.find(item => item.id === id);
  if (!result) throw new Error('Caso desconhecido.');
  result.status = passed ? 'Pass' : 'Fail';
  if (reason) result.reason = reason;
  render();
  if (!passed) throw new Error('Verificação interrompida.');
}
async function local<T>(path: string, body: unknown): Promise<T> {
  const reply = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
  if (!reply.ok) throw new Error('Gravação local recusada.');
  return reply.json() as Promise<T>;
}
async function fixture(): Promise<string> {
  const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');
  context.fillStyle = '#fff1c2'; context.fillRect(0, 0, 480, 160);
  context.fillStyle = '#302516'; context.font = 'bold 48px sans-serif'; context.fillText('TEST DATA', 32, 78);
  context.font = '20px sans-serif'; context.fillText('DataBee DEV — sem valor científico', 32, 120);
  return canvas.toDataURL('image/png').split(',')[1];
}
let config: { url: string; publishableKey: string; projectRef: string } | undefined;
render();
void (async () => {
  try {
    const reply = await fetch('/config', { signal: AbortSignal.timeout(10_000) });
    if (!reply.ok) throw new Error('Configuração indisponível.');
    config = await reply.json() as typeof config;
    if (!config || config.projectRef !== 'uqfuuahziwgxwjymtwil') throw new Error('Projeto dev diferente.');
    project.textContent = `Projeto de desenvolvimento: DataBee (${config.projectRef}).`;
    button.disabled = false;
  } catch { project.textContent = 'Não foi possível conferir o projeto dev. Reinicie a ferramenta local.'; }
})();
form.addEventListener('submit', event => { event.preventDefault(); if (!button.disabled) void run(); });

async function run(): Promise<void> {
  if (!form || !button || !summary || !download || !config) return;
  button.disabled = true; download.hidden = true;
  results.forEach(result => { result.status = 'Not run'; delete result.reason; }); render();
  const clients: SupabaseClient[] = [];
  let lease: string | undefined;
  let manifestSaved = false;
  let stage = 'Entrada nas contas de teste';
  try {
    const client = (): SupabaseClient => {
      if (!config) throw new Error('Configuração ausente.');
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
    const authReason = (code?: string): string =>
      ['invalid_credentials', 'email_not_confirmed', 'over_request_rate_limit', 'user_banned'].includes(code ?? '') ? code ?? 'auth_unavailable' : 'auth_unavailable';
    summary.textContent = stage;
    const loginA = await a.auth.signInWithPassword({ email: input('a-email').trim(), password: input('a-password') });
    record('auth-a', !loginA.error && !!loginA.data.user, loginA.error ? authReason(loginA.error.code) : undefined);
    const loginB = await b.auth.signInWithPassword({ email: input('b-email').trim(), password: input('b-password') });
    record('auth-b', !loginB.error && !!loginB.data.user, loginB.error ? authReason(loginB.error.code) : undefined);
    form.reset();
    if (!loginA.data.user || !loginB.data.user) throw new Error('Login incompleto.');
    record('distinct-accounts', loginA.data.user.id !== loginB.data.user.id);
    stage = 'Salvar ou reabrir o manifesto local'; summary.textContent = stage;
    const claim = await local<{ manifest: SeedManifest; png: string; lease: string }>('/seed-run/claim', {
      a: loginA.data.user.id, b: loginB.data.user.id, png: await fixture(),
    });
    lease = claim.lease; manifestSaved = true; record('manifest-saved', true);
    const png = new Blob([Uint8Array.from(atob(claim.png), char => char.charCodeAt(0))], { type: 'image/png' });
    const progress = async (set: SeedSet, step: Step, state: 'pending' | 'confirmed'): Promise<void> => {
      stage = `Conjunto ${set.role}: ${step} (${state})`; summary.textContent = stage;
      await local('/seed-run/progress', { lease, role: set.role, step, state });
    };
    await executeSeed(a, b, anonymous, claim.manifest, png, progress, (id, passed) => {
      stage = cases.find(item => item.id === id)?.title ?? 'Conferência de acesso'; summary.textContent = stage; record(id, passed);
    });
    summary.textContent = 'Dois conjuntos confirmados. Testes de acesso concluídos; nenhum dado excluído.';
  } catch {
    summary.textContent = `Interrompido em: ${stage}. As etapas Not run não foram verificadas. Use as mesmas contas A/B para retomar; não apague o manifesto. Se outra aba estiver executando, aguarde. Se ela foi fechada durante a execução, reinicie o servidor local.`;
  } finally {
    form.reset();
    await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
    const pass = results.filter(item => item.status === 'Pass').length;
    const fail = results.filter(item => item.status === 'Fail').length;
    summary.textContent += ` ${pass} Pass · ${fail} Fail · ${results.length - pass - fail} Not run.`;
    if (manifestSaved) {
      try { await local('/report', { tests: results }); download.hidden = false; }
      catch { summary.textContent += ' Relatório não salvo; o manifesto local preserva as etapas.'; }
    }
    if (lease) {
      try { await local('/seed-run/release', { lease }); }
      catch { summary.textContent += ' Reinicie o servidor local antes de retomar.'; }
    }
    button.disabled = false;
  }
}
