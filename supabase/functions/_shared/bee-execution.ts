import { BEE_SCHEMA_VERSION, analysisStatusFor, validateBeeAnalysis, type BeeAnalysisV2 } from './bee-analysis.ts';
import {
  BEE_PROMPT_VERSION,
  BEE_SYSTEM_PROMPT,
  buildBeePromptContext,
  type ApprovedPromptCatalog,
} from './bee-prompt.ts';
import { validateJpeg } from './validate-jpeg.ts';

export interface SavedBeeAnalysis {
  schemaVersion: string;
  promptVersion: string;
  catalogVersion: string;
  provider: string;
  model: string;
  modelVersion: string | null;
  status: 'completed' | 'inconclusive';
  result: unknown;
}

interface AttemptReference {
  observationId: string;
  ownerId: string;
  attemptId: string;
}

/** Backend-only port, not yet a SQL implementation.
 * acquire MUST enforce ownership/saved state, quotas and exclusive live attempt
 * in one transaction; it must recheck cache under that same lock.
 * complete MUST commit result + status together, only while this attempt is current.
 * fail MUST change only the current processing attempt, never erase a result/photo.
 */
export interface BeeAttemptStore {
  /** Owner-only result from a completed/inconclusive observation; never a stale processing cache. */
  readCache(observationId: string, ownerId: string): Promise<SavedBeeAnalysis | null>;
  acquire(input: {
    observationId: string;
    ownerId: string;
    schemaVersion: string;
    promptVersion: string;
    catalogVersion: string;
  }): Promise<
    { kind: 'cached'; record: SavedBeeAnalysis } | { kind: 'busy' | 'limited' } | { kind: 'started'; attemptId: string }
  >;
  complete(attempt: AttemptReference, record: SavedBeeAnalysis): Promise<boolean>;
  fail(attempt: AttemptReference): Promise<boolean>;
}

/** Implementations must not retry/fall back automatically or log request data.
 * Only this projection reaches a provider: sanitized image, fixed prompt, catalog.
 */
export interface BeeVisionProvider {
  name: string;
  model: string;
  modelVersion: string | null;
  analyze(input: {
    image: Uint8Array;
    systemPrompt: string;
    catalogContext: string;
    signal: AbortSignal;
  }): Promise<unknown>;
}

export class BeeExecutionError extends Error {
  constructor(
    readonly code:
      | 'configuration_missing'
      | 'invalid_reference'
      | 'busy'
      | 'limited'
      | 'invalid_result'
      | 'timeout'
      | 'cancelled'
      | 'superseded'
      | 'execution_failed',
  ) {
    super(code);
    this.name = 'BeeExecutionError';
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function metadata(value: string): boolean {
  return (
    !!value.trim() && value.length <= 160 && !/[\u0000-\u001f\u007f]/u.test(value) && !/fixture|simulat/iu.test(value)
  );
}

function checkedResult(value: unknown, catalog: ApprovedPromptCatalog): BeeAnalysisV2 {
  try {
    return validateBeeAnalysis(value, catalog.taxa);
  } catch {
    throw new BeeExecutionError('invalid_result');
  }
}

function checkedCache(saved: SavedBeeAnalysis, catalog: ApprovedPromptCatalog): BeeAnalysisV2 {
  if (
    saved.schemaVersion !== BEE_SCHEMA_VERSION ||
    saved.promptVersion !== BEE_PROMPT_VERSION ||
    saved.catalogVersion !== catalog.version ||
    !metadata(saved.provider) ||
    !metadata(saved.model) ||
    (saved.modelVersion !== null && !metadata(saved.modelVersion))
  )
    throw new BeeExecutionError('invalid_result');
  const analysis = checkedResult(saved.result, catalog);
  if (saved.status !== analysisStatusFor(analysis)) throw new BeeExecutionError('invalid_result');
  return analysis;
}

async function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  let abort: (() => void) | undefined;
  const stopped = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
  try {
    return await Promise.race([work, stopped]);
  } finally {
    if (abort) signal.removeEventListener('abort', abort);
  }
}

/** IMP-029 preparation. Caller must authenticate and validate owner/photo first.
 * No adapter or live provider is configured by this module. Store semantics below
 * need a real atomic SQL implementation and remote concurrency tests before deploy.
 */
export async function executeBeeAnalysis(input: {
  observationId: string;
  ownerId: string;
  catalog: ApprovedPromptCatalog;
  provider: BeeVisionProvider | null;
  store: BeeAttemptStore;
  loadImage: (signal: AbortSignal) => Promise<Uint8Array>;
  signal?: AbortSignal;
}): Promise<{ cached: boolean; analysis: BeeAnalysisV2 }> {
  if (!uuid.test(input.observationId) || !uuid.test(input.ownerId)) throw new BeeExecutionError('invalid_reference');
  let context: string;
  try {
    context = buildBeePromptContext(input.catalog);
  } catch {
    throw new BeeExecutionError('configuration_missing');
  }
  if (input.signal?.aborted) throw new BeeExecutionError('cancelled');
  let saved: SavedBeeAnalysis | null;
  try {
    saved = await input.store.readCache(input.observationId, input.ownerId);
  } catch {
    throw new BeeExecutionError('execution_failed');
  }
  if (input.signal?.aborted) throw new BeeExecutionError('cancelled');
  if (saved) return { cached: true, analysis: checkedCache(saved, input.catalog) };
  const provider = input.provider;
  // No quota/state reservation when configuration is missing. This is not cost approval.
  if (
    !provider ||
    !metadata(provider.name) ||
    !metadata(provider.model) ||
    (provider.modelVersion !== null && !metadata(provider.modelVersion))
  )
    throw new BeeExecutionError('configuration_missing');
  if (input.signal?.aborted) throw new BeeExecutionError('cancelled');
  const acquired = await input.store
    .acquire({
      observationId: input.observationId,
      ownerId: input.ownerId,
      schemaVersion: BEE_SCHEMA_VERSION,
      promptVersion: BEE_PROMPT_VERSION,
      catalogVersion: input.catalog.version,
    })
    .catch(() => {
      throw new BeeExecutionError('execution_failed');
    });
  if (acquired.kind === 'busy' || acquired.kind === 'limited') throw new BeeExecutionError(acquired.kind);
  if (acquired.kind === 'cached') {
    if (input.signal?.aborted) throw new BeeExecutionError('cancelled');
    return { cached: true, analysis: checkedCache(acquired.record, input.catalog) };
  }
  // Guard even a faulty adapter: no provider call without a valid attempt reference.
  if (acquired.kind !== 'started' || !uuid.test(acquired.attemptId)) throw new BeeExecutionError('execution_failed');
  const attempt = { observationId: input.observationId, ownerId: input.ownerId, attemptId: acquired.attemptId };
  const timeout = AbortSignal.timeout(45000);
  const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
  try {
    signal.throwIfAborted();
    const image = await untilAborted(input.loadImage(signal), signal);
    validateJpeg(image);
    signal.throwIfAborted();
    // A defensive copy keeps a provider adapter from mutating the validated bytes.
    const raw = await untilAborted(
      provider.analyze({
        image: image.slice(),
        systemPrompt: BEE_SYSTEM_PROMPT,
        catalogContext: context,
        signal,
      }),
      signal,
    );
    signal.throwIfAborted();
    const analysis = checkedResult(raw, input.catalog);
    const committed = await input.store.complete(attempt, {
      schemaVersion: BEE_SCHEMA_VERSION,
      promptVersion: BEE_PROMPT_VERSION,
      catalogVersion: input.catalog.version,
      provider: provider.name,
      model: provider.model,
      modelVersion: provider.modelVersion,
      status: analysisStatusFor(analysis),
      result: analysis,
    });
    if (!committed) throw new BeeExecutionError('superseded');
    return { cached: false, analysis };
  } catch (error) {
    // SQL adapter must only fail a still-current processing attempt. An uncertain
    // commit acknowledgement must not turn an already completed result into failed.
    try {
      await input.store.fail(attempt);
    } catch {
      /* Preserve original sanitized error. */
    }
    if (input.signal?.aborted) throw new BeeExecutionError('cancelled');
    if (timeout.aborted) throw new BeeExecutionError('timeout');
    if (error instanceof BeeExecutionError) throw error;
    throw new BeeExecutionError('execution_failed');
  }
}
