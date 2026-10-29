/** Operational metadata check only. Never generates text or sends observations.
 * Accessible only with the server operator credential, not a user's JWT.
 */
export function createProviderReadinessHandler(
  config: { operatorKey: string; additionalOperatorKeys?: readonly string[]; providerKey: string },
  send: typeof fetch = fetch,
): (request: Request) => Promise<Response> {
  const model = 'ministral-8b-2512'; // Candidate to inspect, not the configured analysis model.
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const reply = (status: number, body: object): Response => {
    const payload =
      'error' in body && typeof body.error === 'string'
        ? { ...body, error: { code: body.error, message: 'Falha na verificação administrativa.' } }
        : body;
    return new Response(JSON.stringify(payload), { status, headers });
  };
  return async (request) => {
    const authorization = request.headers.get('Authorization') ?? '';
    const apiKey = request.headers.get('apikey') ?? '';
    const operatorKey = request.headers.get('x-databee-operator-key') ?? '';
    const operatorKeys = [config.operatorKey, ...(config.additionalOperatorKeys ?? [])].filter(Boolean);
    if (
      !operatorKeys.length ||
      !/^Bearer /i.test(authorization) ||
      authorization.length > 8192 ||
      apiKey.length > 8192 ||
      operatorKey.length > 8192
    )
      return reply(401, { error: 'unauthorized' });
    const encode = new TextEncoder();
    // The gateway may translate Authorization for opaque API keys. Match either
    // supplied credential against server-maintained keys, never an unverified role claim.
    const supplied = await Promise.all(
      [authorization.slice(7), apiKey, operatorKey].map((value) =>
        crypto.subtle.digest('SHA-256', encode.encode(value)),
      ),
    );
    let accepted = 0;
    for (const key of operatorKeys) {
      const expected = new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(key)));
      for (const digest of supplied) {
        const actual = new Uint8Array(digest);
        let difference = 0;
        for (let index = 0; index < expected.length; index++) difference |= expected[index] ^ actual[index];
        accepted |= Number(difference === 0);
      }
    }
    if (!accepted) return reply(401, { error: 'unauthorized' });
    if (request.method !== 'GET') return reply(405, { error: 'method_not_allowed' });
    if (new URL(request.url).search || request.body) return reply(400, { error: 'invalid_request' });
    if (request.signal.aborted) return reply(408, { error: 'request_cancelled' });
    // Clipboard/secret forms can preserve a final newline. Only outer whitespace
    // is transport formatting; whitespace inside a credential remains invalid.
    const providerKey = config.providerKey.trim();
    if (!providerKey || /\s/u.test(providerKey))
      return reply(503, {
        error: 'configuration_missing',
        reason: providerKey ? 'malformed_provider_key' : 'absent_provider_key',
      });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10000)]);
    try {
      const response = await send('https://api.mistral.ai/v1/models/' + model, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + providerKey, Accept: 'application/json' },
        redirect: 'error',
        cache: 'no-store',
        signal,
      });
      if (response.status === 401 || response.status === 403)
        return reply(503, { error: 'provider_access_denied', check: 'metadata_only' });
      if (response.status === 429) return reply(429, { error: 'provider_limited', check: 'metadata_only' });
      if (!response.ok) return reply(502, { error: 'provider_unavailable', check: 'metadata_only' });
      const reader = response.body?.getReader();
      if (!reader) return reply(502, { error: 'invalid_metadata' });
      const decoder = new TextDecoder('utf-8', { fatal: true });
      let size = 0;
      let content = '';
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          size += next.value.length;
          if (size > 16384) {
            await reader.cancel();
            return reply(502, { error: 'invalid_metadata' });
          }
          content += decoder.decode(next.value, { stream: true });
        }
        content += decoder.decode();
      } finally {
        reader.releaseLock();
      }
      signal.throwIfAborted();
      const metadata: unknown = JSON.parse(content);
      if (!metadata || typeof metadata !== 'object' || !('id' in metadata) || metadata.id !== model)
        return reply(502, { error: 'invalid_metadata' });
      const capabilities = 'capabilities' in metadata ? metadata.capabilities : null;
      if (
        !capabilities ||
        typeof capabilities !== 'object' ||
        !('vision' in capabilities) ||
        capabilities.vision !== true ||
        !('completion_chat' in capabilities) ||
        capabilities.completion_chat !== true
      )
        return reply(503, { error: 'model_capability_missing', check: 'metadata_only' });
      return reply(200, {
        provider: 'mistral',
        check: 'metadata_only',
        model,
        available: true,
        capabilities: { vision: true, completion_chat: true },
        generation_tested: false,
        photo_sent: false,
      });
    } catch {
      return signal.aborted
        ? reply(504, { error: 'provider_timeout', check: 'metadata_only' })
        : reply(502, { error: 'provider_unavailable', check: 'metadata_only' });
    }
  };
}
