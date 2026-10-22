// Cliente manual, fora do app/APK. Credenciais de usuários nunca passam por este servidor.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { createSeedHandler } from './manual/test-data.server.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modes = [
  { flag: '--profiles', taskId: 'IMP-032', assetName: 'profile-privacy', port: 4214, migrationFile: '20261021115711_imp032_profiles.sql' },
  { flag: '--images', taskId: 'IMP-014', assetName: 'observation-images', port: 4215, migrationFile: '20261021122259_imp014_observation_images.sql' },
  { flag: '--storage', taskId: 'IMP-015', assetName: 'observation-storage', port: 4216, migrationFile: '20261021130929_imp015_private_storage.sql' },
  { flag: '--seed', taskId: 'IMP-069', assetName: 'test-data', port: 4217, migrationFile: '20261021130929_imp015_private_storage.sql' },
];
const selectedModes = modes.filter(mode => process.argv.includes(mode.flag));
if (selectedModes.length > 1) throw new Error('Selecione apenas um roteiro de verificação.');
const { taskId, assetName, port, migrationFile } = selectedModes[0] ?? {
  taskId: 'IMP-013', assetName: 'observation-privacy', port: 4213, migrationFile: '20261016032127_imp013_observations_private_locations.sql',
};
const localConfig = readFileSync(join(root, 'src/environments/supabase.config.ts'), 'utf8');
const url = localConfig.match(/url\s*:\s*['"]([^'"]*)['"]/u)?.[1]?.trim();
const publishableKey = localConfig.match(/publishableKey\s*:\s*['"]([^'"]*)['"]/u)?.[1]?.trim();
const reference = readFileSync(join(root, 'supabase/.temp/project-ref'), 'utf8').trim();
if (!/^[a-z]{20}$/.test(reference) || url !== `https://${reference}.supabase.co` || !publishableKey?.startsWith('sb_publishable_')) {
  throw new Error('Confirme a chave pública e o vínculo ao mesmo projeto dev antes de abrir o cliente.');
}
const require = createRequire(import.meta.url);
// Reutiliza o esbuild já instalado e fixado pelo build Angular, sem nova dependência.
const { build } = require('esbuild');
const bundle = await build({
  entryPoints: [join(root, `scripts/manual/${assetName}.client.ts`)],
  bundle: true, write: false, platform: 'browser', format: 'esm', target: 'es2022', logLevel: 'silent',
});
const cases = JSON.parse(readFileSync(join(root, `scripts/manual/${assetName}.cases.json`), 'utf8'));
const testIds = new Set(cases.map(item => item.id));
const authReasons = new Set(['invalid_credentials', 'email_not_confirmed', 'over_request_rate_limit', 'user_banned', 'auth_unavailable']);
const origin = `http://127.0.0.1:${port}`;
const reportPath = join(root, `.tmp/${taskId.toLowerCase().replace('-', '')}-privacy-report.json`);
const migrationVersion = migrationFile.slice(0, 14);
const migrationSha256 = createHash('sha256').update(readFileSync(join(root, 'supabase/migrations', migrationFile))).digest('hex');
const seedHandler = taskId === 'IMP-069' ? createSeedHandler(root, reference, origin) : null;
const scriptSha256 = createHash('sha256').update(bundle.outputFiles[0].contents).digest('hex');
const serverSha256 = seedHandler ? createHash('sha256')
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .update(readFileSync(join(root, 'scripts/manual/test-data.server.mjs'))).digest('hex') : undefined;
const assets = new Map([
  ['/', ['text/html; charset=utf-8', readFileSync(join(root, `scripts/manual/${assetName}.html`))]],
  ['/client.css', ['text/css; charset=utf-8', readFileSync(join(root, 'scripts/manual/observation-privacy.css'))]],
  ['/client.js', ['text/javascript; charset=utf-8', bundle.outputFiles[0].contents]],
  ['/config', ['application/json', JSON.stringify({ url, publishableKey, projectRef: reference })]],
]);

createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self' ${url}; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
  if (request.headers.host !== `127.0.0.1:${port}`) { response.writeHead(403).end(); return; }
  if (seedHandler && await seedHandler(request, response)) return;
  const path = request.url;
  if (request.method === 'GET' && assets.has(path)) {
    const [contentType, content] = assets.get(path);
    response.setHeader('Content-Type', contentType);
    response.end(content);
    return;
  }
  if (path === '/report' && request.method === 'GET') {
    try {
      response.setHeader('Content-Type', 'application/json');
      response.end(readFileSync(reportPath));
    } catch { response.writeHead(404).end(); }
    return;
  }
  if (path === '/report' && request.method === 'POST' && request.headers.origin === origin) {
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 32768) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!Array.isArray(payload.tests) || payload.tests.length !== testIds.size) throw new Error('Formato inválido.');
      const seen = new Set();
      const tests = payload.tests.map(item => {
        if (!item || !testIds.has(item.id) || seen.has(item.id) || !['Pass', 'Fail', 'Not run'].includes(item.status)) {
          throw new Error('Resultado inválido.');
        }
        seen.add(item.id);
        // Somente identificadores fixos, resultado e código SQL; descarta todo campo extra.
        return { id: item.id, status: item.status,
          ...(typeof item.code === 'string' && /^[A-Z0-9]{5}$/.test(item.code) ? { code: item.code } : {}),
          ...((item.id === 'auth-a' || item.id === 'auth-b') && authReasons.has(item.reason) ? { reason: item.reason } : {}),
        };
      });
      mkdirSync(join(root, '.tmp'), { recursive: true });
      const report = { project_ref: reference, migration_version: migrationVersion, migration_sha256: migrationSha256, script_sha256: scriptSha256, ...(serverSha256 ? { server_sha256: serverSha256 } : {}), recorded_at: new Date().toISOString(), source: 'manual-sdk-client', tests };
      if (seedHandler) seedHandler.saveReport(report);
      else writeFileSync(reportPath, JSON.stringify(report, null, 2));
      response.setHeader('Content-Type', 'application/json');
      response.end('{"saved":true}');
    } catch { response.writeHead(400).end(); }
    return;
  }
  response.writeHead(404).end();
}).listen(port, '127.0.0.1', () => {
  console.log(`Cliente manual da ${taskId}: ${origin}`);
  console.log('Use A/B somente nesta página local. Ctrl+C encerra. Relatório fica em .tmp (fora do Git).');
});
