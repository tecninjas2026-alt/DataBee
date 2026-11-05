import { BeeExecutionError, type BeeVisionProvider } from './bee-execution.ts';
import {
  BEE_EVALUATION_PROMPT,
  BEE_SYSTEM_PROMPT,
  buildBeePromptContext,
  type ApprovedPromptCatalog,
} from './bee-prompt.ts';
import { validateJpeg } from './validate-jpeg.ts';

/** Temporary operator-only DEV comparison. No participant access, database writes or raw diagnostics. */
export function createProviderEvaluationHandler(config: {
  enabled: boolean;
  operatorKeys: readonly string[];
  catalog: ApprovedPromptCatalog;
  baseline: BeeVisionProvider | null;
  conservative: BeeVisionProvider | null;
}): (request: Request) => Promise<Response> {
  const reply = (status: number, body: object): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  return async (request) => {
    const authorization = request.headers.get('Authorization') ?? '';
    const values = [
      authorization.slice(7),
      request.headers.get('apikey') ?? '',
      request.headers.get('x-databee-operator-key') ?? '',
    ];
    if (!/^Bearer /i.test(authorization) || authorization.length > 8192 || values.some((value) => value.length > 8192))
      return reply(401, { error: 'unauthorized' });
    const encoder = new TextEncoder();
    const supplied = await Promise.all(values.map((value) => crypto.subtle.digest('SHA-256', encoder.encode(value))));
    let accepted = 0;
    for (const key of config.operatorKeys.filter(Boolean)) {
      const expected = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(key)));
      for (const value of supplied) {
        const actual = new Uint8Array(value);
        let difference = 0;
        for (let i = 0; i < expected.length; i++) difference |= expected[i] ^ actual[i];
        accepted |= Number(difference === 0);
      }
    }
    if (!accepted) return reply(401, { error: 'unauthorized' });
    if (!config.enabled) return reply(503, { error: 'evaluation_disabled' });
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    const variant = request.headers.get('x-databee-evaluation-variant');
    if (
      new URL(request.url).search ||
      request.headers.get('Content-Type') !== 'image/jpeg' ||
      !['baseline', 'conservative-v1'].includes(variant ?? '')
    )
      return reply(400, { error: 'invalid_request' });
    const provider = variant === 'baseline' ? config.baseline : config.conservative;
    if (!provider) return reply(503, { error: 'configuration_missing' });
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: 'image_required' });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45000)]);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        signal.throwIfAborted();
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > 5 * 1024 * 1024) {
          await reader.cancel();
          return reply(413, { error: 'image_too_large' });
        }
        chunks.push(next.value);
      }
      const image = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        image.set(chunk, offset);
        offset += chunk.length;
      }
      try {
        validateJpeg(image);
      } catch {
        return reply(400, { error: 'invalid_image' });
      }
      const analysis = await provider.analyze({
        image,
        signal,
        systemPrompt: variant === 'baseline' ? BEE_SYSTEM_PROMPT : BEE_EVALUATION_PROMPT,
        catalogContext: buildBeePromptContext(config.catalog),
      });
      signal.throwIfAborted();
      return reply(200, {
        variant,
        model: provider.model,
        catalogVersion: config.catalog.version,
        analysis,
        persisted: false,
      });
    } catch (error) {
      if (signal.aborted) return reply(408, { error: 'evaluation_failed' });
      if (error instanceof BeeExecutionError) {
        const status = error.code === 'limited' ? 429 : error.code === 'timeout' ? 504 : 502;
        return reply(status, { error: error.code });
      }
      return reply(502, { error: 'evaluation_failed' });
    } finally {
      reader.releaseLock();
    }
  };
}
