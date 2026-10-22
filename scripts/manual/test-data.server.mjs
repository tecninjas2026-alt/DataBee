// Somente disco local. Não recebe senhas, tokens Supabase ou faz chamadas remotas.
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const accountId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const steps = ['observation', 'location', 'upload', 'metadata'];

export function createSeedHandler(root, projectRef, origin) {
  const directory = join(root, '.tmp');
  const pointer = join(directory, 'imp069-active-run.json');
  let lease = null;
  const file = (id, suffix) => {
    if (!uuid.test(id)) throw new Error('Execução inválida.');
    return join(directory, `imp069-${id}-${suffix}`);
  };
  const atomic = (path, data) => {
    const temporary = `${path}.${randomUUID()}.tmp`;
    writeFileSync(temporary, JSON.stringify(data, null, 2), { flag: 'wx', flush: true });
    renameSync(temporary, path);
  };
  const load = () => {
    let id;
    try { id = JSON.parse(readFileSync(pointer, 'utf8')).run_id; }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    const manifest = JSON.parse(readFileSync(file(id, 'manifest.json'), 'utf8'));
    if (manifest.run_id !== id || manifest.project_ref !== projectRef || manifest.dataset_label !== 'TEST DATA') {
      throw new Error('Manifesto inconsistente.');
    }
    if (manifest.schema_version !== 1 || !Array.isArray(manifest.sets) || manifest.sets.length !== 2 ||
      !manifest.fixture || manifest.fixture.mime !== 'image/png' || !/^[0-9a-f]{64}$/.test(manifest.fixture.sha256) ||
      !Number.isInteger(manifest.fixture.bytes) || manifest.fixture.bytes < 100 || manifest.fixture.bytes > 32768) {
      throw new Error('Manifesto incompleto.');
    }
    for (const [index, set] of manifest.sets.entries()) {
      if (!set || set.role !== ['A', 'B'][index] || !accountId.test(set.owner_id) ||
        !uuid.test(set.observation_id) || !uuid.test(set.image_id) || set.bucket !== 'observation-images' ||
        set.object_path !== `${set.owner_id}/${set.observation_id}/${set.image_id}.png` ||
        !set.synthetic_location || set.synthetic_location.latitude !== 0 || set.synthetic_location.longitude !== index ||
        set.synthetic_location.location_source !== 'user_informed' || set.synthetic_location.accuracy !== null || set.synthetic_location.consent_at !== null ||
        !set.progress || !steps.every(step => ['planned', 'pending', 'confirmed'].includes(set.progress[step]))) {
        throw new Error('Conjunto inconsistente.');
      }
    }
    if (manifest.sets[0].owner_id === manifest.sets[1].owner_id ||
      new Set(manifest.sets.flatMap(set => [set.observation_id, set.image_id])).size !== 4) throw new Error('IDs repetidos.');
    return manifest;
  };
  const persist = manifest => {
    manifest.updated_at = new Date().toISOString();
    atomic(file(manifest.run_id, 'manifest.json'), manifest);
  };
  const migrations = [
    '20261016032127_imp013_observations_private_locations.sql',
    '20261021115711_imp032_profiles.sql',
    '20261021122259_imp014_observation_images.sql',
    '20261021130929_imp015_private_storage.sql',
  ].map(name => ({ version: name.slice(0, 14), sha256: createHash('sha256').update(readFileSync(join(root, 'supabase/migrations', name))).digest('hex') }));

  const handler = async (request, response) => {
    if (!request.url?.startsWith('/seed-run')) return false;
    response.setHeader('Content-Type', 'application/json');
    try {
      if (request.method === 'GET' && request.url === '/seed-run') {
        response.end(JSON.stringify(load())); return true;
      }
      if (request.method !== 'POST' || request.headers.origin !== origin || request.headers['content-type'] !== 'application/json') {
        response.writeHead(403).end('{}'); return true;
      }
      const chunks = []; let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 65536) { response.writeHead(413).end('{}'); return true; }
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (request.url === '/seed-run/claim') {
        if (lease) { response.writeHead(409).end('{}'); return true; }
        if (!accountId.test(body.a) || !accountId.test(body.b) || body.a === body.b) throw new Error('Contas inválidas.');
        let manifest = load();
        if (!manifest) {
          if (typeof body.png !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(body.png)) throw new Error('PNG inválido.');
          const png = Buffer.from(body.png, 'base64');
          if (png.length < 100 || png.length > 32768 || png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 480 || png.readUInt32BE(20) !== 160) throw new Error('Fixture inválida.');
          const runId = randomUUID();
          const set = (role, ownerId, longitude) => {
            const observationId = randomUUID(); const imageId = randomUUID();
            return { role, owner_id: ownerId, observation_id: observationId, image_id: imageId,
              bucket: 'observation-images', object_path: `${ownerId}/${observationId}/${imageId}.png`,
              synthetic_location: { latitude: 0, longitude, location_source: 'user_informed', accuracy: null, consent_at: null },
              progress: Object.fromEntries(steps.map(step => [step, 'planned'])) };
          };
          manifest = { schema_version: 1, run_id: runId, dataset_label: 'TEST DATA', project_ref: projectRef,
            created_at: new Date().toISOString(), migrations_local: migrations,
            fixture: { source: 'browser-canvas-TEST-DATA', mime: 'image/png', bytes: png.length, sha256: createHash('sha256').update(png).digest('hex') },
            sets: [set('A', body.a, 0), set('B', body.b, 1)] };
          mkdirSync(directory, { recursive: true });
          writeFileSync(file(runId, 'fixture.png'), png, { flag: 'wx', flush: true });
          persist(manifest);
          // Nenhum ID é entregue ao cliente antes de ambos os arquivos estarem gravados.
          atomic(pointer, { run_id: runId });
        }
        if (manifest.sets[0].owner_id !== body.a || manifest.sets[1].owner_id !== body.b) throw new Error('Reutilize as mesmas contas A/B.');
        const png = readFileSync(file(manifest.run_id, 'fixture.png'));
        if (createHash('sha256').update(png).digest('hex') !== manifest.fixture.sha256) throw new Error('Fixture alterada.');
        lease = randomUUID();
        response.end(JSON.stringify({ manifest, png: png.toString('base64'), lease })); return true;
      }
      if (!lease || body.lease !== lease) { response.writeHead(409).end('{}'); return true; }
      if (request.url === '/seed-run/release') {
        lease = null; response.end('{}'); return true;
      }
      if (request.url === '/seed-run/progress') {
        const manifest = load();
        const set = manifest?.sets.find(item => item.role === body.role);
        if (!set || !steps.includes(body.step) || !['pending', 'confirmed'].includes(body.state)) throw new Error('Etapa inválida.');
        if (set.progress[body.step] === 'confirmed' && body.state !== 'confirmed') throw new Error('Etapa confirmada.');
        set.progress[body.step] = body.state;
        persist(manifest); response.end('{"saved":true}'); return true;
      }
      response.writeHead(404).end('{}'); return true;
    } catch { response.writeHead(400).end('{}'); return true; }
  };
  handler.saveReport = report => {
    const manifest = load();
    if (!manifest) throw new Error('Manifesto ausente.');
    const output = { ...report, migrations_local: migrations };
    atomic(file(manifest.run_id, 'report.json'), output);
    atomic(join(directory, 'imp069-privacy-report.json'), output);
  };
  return handler;
}
