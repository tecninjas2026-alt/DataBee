import { BEE_ANALYSIS_SCHEMA, parseBeeAnalysis } from './bee-analysis.ts';
import { BeeExecutionError, type BeeVisionProvider } from './bee-execution.ts';
import { BEE_SYSTEM_PROMPT, buildBeePromptContext, type ApprovedPromptCatalog } from './bee-prompt.ts';
import { validateJpeg } from './validate-jpeg.ts';

/** Server-maintained release attestations, never accepted from an HTTP body.
 * These flags record a responsible person's checks; they cannot verify billing,
 * eligibility or privacy settings on the provider account by themselves.
 */
export interface MistralVisionConfiguration {
  enabled: boolean;
  freeModeVerified: boolean;
  apiTrainingDisabled: boolean;
  audienceAndTermsReviewed: boolean;
  modelCapabilitiesVerified: boolean;
  apiKey: string;
  /** Stable version checked in this account; aliases/latest and preview models refused. */
  model: string;
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BeeExecutionError('invalid_result');
  return value as Record<string, unknown>;
}

async function boundedJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new BeeExecutionError('invalid_result');
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.length;
      if (total > 65536) {
        await reader.cancel();
        throw new BeeExecutionError('invalid_result');
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    try {
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
    } catch {
      throw new BeeExecutionError('invalid_result');
    }
  } finally {
    reader.releaseLock();
  }
}

function jpegDataUrl(image: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < image.length; offset += 32768)
    binary += String.fromCharCode(...image.subarray(offset, offset + 32768));
  return 'data:image/jpeg;base64,' + btoa(binary);
}

/** Candidate adapter, not activated or wired to a deployed function.
 * One request to the fixed official host. No retries, redirects, paid fallback,
 * provider prompt metadata, signed URLs, raw response persistence or logs.
 */
export function createMistralVisionProvider(
  config: MistralVisionConfiguration,
  catalog: ApprovedPromptCatalog,
  send: typeof fetch = fetch,
): BeeVisionProvider | null {
  if (
    config.enabled !== true ||
    config.freeModeVerified !== true ||
    config.apiTrainingDisabled !== true ||
    config.audienceAndTermsReviewed !== true ||
    config.modelCapabilitiesVerified !== true ||
    typeof config.apiKey !== 'string' ||
    !config.apiKey.trim() ||
    config.apiKey.length > 512 ||
    /\s/u.test(config.apiKey) ||
    typeof config.model !== 'string' ||
    !/^[a-z][a-z0-9-]{1,120}-[0-9]{4}$/u.test(config.model) ||
    /preview|labs|experimental/u.test(config.model)
  )
    return null;
  let expectedContext: string;
  try {
    expectedContext = buildBeePromptContext(catalog);
  } catch {
    return null;
  }
  const key = config.apiKey;
  const model = config.model;
  // Isolate the allowed IDs/levels from later mutation of the caller's catalog.
  const taxa = catalog.taxa.map(({ id, taxonomicLevel }) => ({ id, taxonomicLevel }));
  return {
    name: 'mistral',
    model,
    modelVersion: model,
    async analyze(input) {
      if (input.signal.aborted) throw new BeeExecutionError('cancelled');
      if (input.systemPrompt !== BEE_SYSTEM_PROMPT || input.catalogContext !== expectedContext)
        throw new BeeExecutionError('configuration_missing');
      try {
        validateJpeg(input.image);
      } catch {
        throw new BeeExecutionError('execution_failed');
      }
      const deadline = AbortSignal.timeout(35000);
      const signal = AbortSignal.any([input.signal, deadline]);
      try {
        const response = await send('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          redirect: 'error',
          cache: 'no-store',
          signal,
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            n: 1,
            max_tokens: 2048,
            temperature: 0,
            messages: [
              { role: 'system', content: BEE_SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: expectedContext },
                  { type: 'image_url', image_url: jpegDataUrl(input.image) },
                ],
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'bee_analysis_v2',
                strict: true,
                schema: BEE_ANALYSIS_SCHEMA,
              },
            },
          }),
        });
        if (response.status === 429) throw new BeeExecutionError('limited');
        if (response.status === 401 || response.status === 403) throw new BeeExecutionError('configuration_missing');
        if (response.status === 408 || response.status === 504) throw new BeeExecutionError('timeout');
        if (!response.ok) throw new BeeExecutionError('execution_failed');
        const body = jsonObject(await boundedJson(response));
        signal.throwIfAborted();
        if (body['model'] !== model || !Array.isArray(body['choices']) || body['choices'].length !== 1)
          throw new BeeExecutionError('invalid_result');
        const choice = jsonObject(body['choices'][0]);
        const message = jsonObject(choice['message']);
        if (
          choice['finish_reason'] !== 'stop' ||
          message['role'] !== 'assistant' ||
          typeof message['content'] !== 'string' ||
          message['refusal'] ||
          (message['tool_calls'] !== undefined &&
            message['tool_calls'] !== null &&
            (!Array.isArray(message['tool_calls']) || message['tool_calls'].length !== 0))
        )
          throw new BeeExecutionError('invalid_result');
        try {
          return parseBeeAnalysis(message['content'], taxa);
        } catch {
          throw new BeeExecutionError('invalid_result');
        }
      } catch (error) {
        if (input.signal.aborted) throw new BeeExecutionError('cancelled');
        if (deadline.aborted) throw new BeeExecutionError('timeout');
        if (error instanceof BeeExecutionError) throw error;
        throw new BeeExecutionError('execution_failed');
      }
    },
  };
}
