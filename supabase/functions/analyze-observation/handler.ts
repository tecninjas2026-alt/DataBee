import { analysisStatusFor, validateBeeAnalysis, type BeeAnalysisV2 } from '../_shared/bee-analysis.ts';
import { BeeExecutionError } from '../_shared/bee-execution.ts';
import { buildBeePromptContext, type ApprovedPromptCatalog } from '../_shared/bee-prompt.ts';
import { validateJpeg } from '../_shared/validate-jpeg.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export interface StubObservation {
  id: string;
  user_id: string;
  lifecycle: string;
  publication: string;
  analysis_status: string;
  photo_source: string;
}

export interface StubImage {
  id: string;
  owner_id: string;
  object_path: string;
  mime_type: string;
  bytes: number;
  position: number;
  photo_source: string;
}

/** Only owner-scoped reads. No provider, privileged client or persistence port. */
export interface AnalysisStubReads {
  authenticate(signal: AbortSignal): Promise<string | null>;
  observation(id: string, owner: string, signal: AbortSignal): Promise<StubObservation | null>;
  image(id: string, owner: string, signal: AbortSignal): Promise<StubImage | null>;
  download(path: string, signal: AbortSignal): Promise<Blob | null>;
}

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function failure(status: number, code: string, message: string): Response {
  return reply(status, { error: { code, message } });
}

async function observationId(request: Request): Promise<string | null> {
  // Bound the actual stream, rather than trusting Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return null;
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.length;
      if (length > 1024) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !('observation_id' in body) ||
      typeof body.observation_id !== 'string' ||
      !uuid.test(body.observation_id)
    )
      return null;
    return body.observation_id.toLowerCase();
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

/** Preparation for IMP-027, not an identification endpoint ready for production.
 * Catalog is maintainer-controlled; HTTP clients cannot supply/approve one.
 * A missing catalog fails closed, preserving the saved observation untouched.
 */
export type AnalysisExecution = (input: {
  observationId: string;
  ownerId: string;
  loadImage: (signal: AbortSignal) => Promise<Uint8Array>;
  signal: AbortSignal;
}) => Promise<{ cached: boolean; analysis: BeeAnalysisV2 }>;

/** Explicit simulation factory retained for local contract checks only. */
export function createAnalysisStubHandler(
  readsFor: (authorization: string) => AnalysisStubReads | null,
  catalog: ApprovedPromptCatalog | null,
) {
  return createHandler(readsFor, catalog, null, () => false);
}
/** No simulated result path: execution is mandatory, owner pilot gate defaults closed. */
export function createLiveAnalysisHandler(
  readsFor: (authorization: string) => AnalysisStubReads | null,
  catalog: ApprovedPromptCatalog,
  execute: AnalysisExecution,
  allowOwner: (owner: string) => boolean = () => false,
) {
  return createHandler(readsFor, catalog, execute, allowOwner);
}

function createHandler(
  readsFor: (authorization: string) => AnalysisStubReads | null,
  catalog: ApprovedPromptCatalog | null,
  execute: AnalysisExecution | null,
  allowOwner: (owner: string) => boolean,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return failure(405, 'method_not_allowed', 'Use POST.');
    const authorization = request.headers.get('Authorization');
    if (!authorization || !/^Bearer \S+$/i.test(authorization))
      return failure(401, 'unauthorized', 'Entre na sua conta.');

    try {
      const reads = readsFor(authorization);
      if (!reads) return failure(503, 'configuration_missing', 'Identificação ainda não disponível.');
      const owner = await reads.authenticate(AbortSignal.timeout(15000));
      if (!owner || !uuid.test(owner)) return failure(401, 'unauthorized', 'Entre novamente na sua conta.');
      if (execute && !allowOwner(owner))
        return failure(403, 'pilot_restricted', 'Identificação em teste orientado pela equipe.');
      const id = await observationId(request);
      if (!id) return failure(400, 'invalid_request', 'Envie apenas a referência válida da observação.');
      const observation = await reads.observation(id, owner, AbortSignal.timeout(15000));
      if (!observation || observation.id !== id || observation.user_id !== owner)
        return failure(404, 'not_found', 'Observação não encontrada.');
      if (
        observation.lifecycle !== 'saved' ||
        observation.publication !== 'private' ||
        (observation.analysis_status === 'processing' && !execute) ||
        !['idle', 'processing', 'failed', 'completed', 'inconclusive'].includes(observation.analysis_status)
      )
        return failure(409, 'state_conflict', 'Reabra uma observação privada já salva.');

      // Do not download a photo until the server has a reviewed reference catalog.
      try {
        if (!catalog) throw new Error('catalog_missing');
        buildBeePromptContext(catalog);
      } catch {
        return failure(503, 'catalog_unavailable', 'Identificação aguardando o catálogo revisado da equipe.');
      }
      const image = await reads.image(id, owner, AbortSignal.timeout(15000));
      if (
        !image ||
        !uuid.test(image.id) ||
        image.owner_id !== owner ||
        image.object_path !== `${owner}/${id}/${image.id}.jpg` ||
        image.mime_type !== 'image/jpeg' ||
        !Number.isInteger(image.bytes) ||
        image.bytes < 1 ||
        image.bytes > 5242880 ||
        image.position !== 0 ||
        !['camera', 'gallery'].includes(observation.photo_source) ||
        image.photo_source !== observation.photo_source
      )
        return failure(409, 'image_not_ready', 'A foto salva precisa ser conferida.');
      const loadImage = async (signal: AbortSignal): Promise<Uint8Array> => {
        const blob = await reads.download(image.object_path, AbortSignal.any([signal, AbortSignal.timeout(20000)]));
        if (!blob || blob.size !== image.bytes || blob.type !== 'image/jpeg') throw new Error('image_unavailable');
        const bytes = new Uint8Array(await blob.arrayBuffer());
        validateJpeg(bytes);
        return bytes;
      };
      if (execute) {
        const completed = await execute({ observationId: id, ownerId: owner, loadImage, signal: request.signal });
        return reply(200, {
          observation_id: id,
          status: analysisStatusFor(completed.analysis),
          analysis: completed.analysis,
          cached: completed.cached,
        });
      }
      const blob = await reads.download(image.object_path, AbortSignal.timeout(20000));
      if (!blob) return failure(503, 'image_unavailable', 'Não foi possível conferir a foto. Tente mais tarde.');
      if (blob.size !== image.bytes || blob.type !== 'image/jpeg')
        return failure(409, 'image_invalid', 'O arquivo não corresponde à foto salva.');
      try {
        validateJpeg(new Uint8Array(await blob.arrayBuffer()));
      } catch {
        return failure(409, 'image_invalid', 'A foto precisa estar no formato tratado pelo app.');
      }
      const analysis = validateBeeAnalysis(
        {
          status: 'inconclusive',
          matches: [],
          imageQuality: 'poor',
          limitations: ['SIMULAÇÃO técnica: nenhuma IA analisou esta foto; nenhum resultado foi salvo.'],
        },
        catalog.taxa,
      );
      return reply(200, { simulation: true, persisted: false, analysis });
    } catch (error) {
      if (error instanceof BeeExecutionError) {
        const statuses = {
          configuration_missing: 503,
          invalid_reference: 400,
          busy: 409,
          limited: 429,
          invalid_result: 502,
          timeout: 504,
          cancelled: 408,
          superseded: 409,
          execution_failed: 502,
        };
        return failure(
          statuses[error.code],
          error.code,
          'Não foi possível concluir a análise. Sua observação continua salva.',
        );
      }
      return failure(503, 'read_unavailable', 'Não foi possível conferir o registro. Tente mais tarde.');
    }
  };
}
