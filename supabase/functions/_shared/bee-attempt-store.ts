import { analysisStatusFor, validateBeeAnalysis } from './bee-analysis.ts';
import { BeeExecutionError, type BeeAttemptStore, type SavedBeeAnalysis } from './bee-execution.ts';
import { buildBeePromptContext, type ApprovedPromptCatalog } from './bee-prompt.ts';

/** Caller supplies a server-only RPC transport; no client token is accepted here. */
export type BeeAttemptRpc = (name: string, args: Record<string, unknown>) => Promise<unknown>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BeeExecutionError('invalid_result');
  return value as Record<string, unknown>;
}
function metadata(value: unknown, max: number): value is string {
  return (
    typeof value === 'string' &&
    !!value.trim() &&
    value.length <= max &&
    !/[\u0000-\u001f\u007f]/u.test(value) &&
    !/fixture|simulat/iu.test(value)
  );
}
function reference(observationId: string, ownerId: string, attemptId?: string): Record<string, unknown> {
  if (!uuid.test(observationId) || !uuid.test(ownerId) || (attemptId !== undefined && !uuid.test(attemptId)))
    throw new BeeExecutionError('invalid_reference');
  return {
    p_observation_id: observationId,
    p_owner_id: ownerId,
    ...(attemptId === undefined ? {} : { p_attempt_id: attemptId }),
  };
}

/** Full validation before persistence; SQL envelope constraints are additional guards. */
export function createSqlBeeAttemptStore(call: BeeAttemptRpc, catalog: ApprovedPromptCatalog): BeeAttemptStore {
  buildBeePromptContext(catalog);
  const version = catalog.version;
  const taxa = catalog.taxa.map(({ id, taxonomicLevel }) => ({ id, taxonomicLevel }));
  function record(value: unknown): SavedBeeAnalysis {
    const raw = object(value);
    if (
      raw['schemaVersion'] !== '2.0' ||
      raw['promptVersion'] !== 'bee-v2' ||
      raw['catalogVersion'] !== version ||
      !metadata(raw['provider'], 80) ||
      !metadata(raw['model'], 160) ||
      (raw['modelVersion'] !== null && !metadata(raw['modelVersion'], 160))
    )
      throw new BeeExecutionError('invalid_result');
    let analysis;
    try {
      analysis = validateBeeAnalysis(raw['result'], taxa);
    } catch {
      throw new BeeExecutionError('invalid_result');
    }
    const status = analysisStatusFor(analysis);
    if (raw['status'] !== status) throw new BeeExecutionError('invalid_result');
    return {
      schemaVersion: '2.0',
      promptVersion: 'bee-v2',
      catalogVersion: version,
      provider: raw['provider'],
      model: raw['model'],
      modelVersion: raw['modelVersion'],
      status,
      result: analysis,
    };
  }
  async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
    try {
      return await call(name, args);
    } catch {
      throw new BeeExecutionError('execution_failed');
    }
  }
  async function boolean(name: string, args: Record<string, unknown>): Promise<boolean> {
    const value = await rpc(name, args);
    if (typeof value !== 'boolean') throw new BeeExecutionError('execution_failed');
    return value;
  }
  return {
    async readCache(observationId, ownerId) {
      const value = await rpc('read_ai_analysis_cache', reference(observationId, ownerId));
      return value === null ? null : record(value);
    },
    async acquire(input) {
      if (input.schemaVersion !== '2.0' || input.promptVersion !== 'bee-v2' || input.catalogVersion !== version)
        throw new BeeExecutionError('configuration_missing');
      const value = object(
        await rpc('acquire_ai_analysis_attempt', {
          ...reference(input.observationId, input.ownerId),
          p_schema_version: '2.0',
          p_prompt_version: 'bee-v2',
          p_catalog_version: version,
        }),
      );
      if (value['kind'] === 'busy' || value['kind'] === 'limited') return { kind: value['kind'] };
      if (value['kind'] === 'cached') return { kind: 'cached', record: record(value['record']) };
      if (value['kind'] === 'started' && typeof value['attemptId'] === 'string' && uuid.test(value['attemptId']))
        return { kind: 'started', attemptId: value['attemptId'] };
      throw new BeeExecutionError('execution_failed');
    },
    async complete(attempt, saved) {
      const args = reference(attempt.observationId, attempt.ownerId, attempt.attemptId);
      const checked = record(saved);
      return boolean('complete_ai_analysis_attempt', { ...args, p_record: checked });
    },
    async fail(attempt) {
      return boolean('fail_ai_analysis_attempt', reference(attempt.observationId, attempt.ownerId, attempt.attemptId));
    },
  };
}
