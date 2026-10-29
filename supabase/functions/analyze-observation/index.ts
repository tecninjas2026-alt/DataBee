import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { createAnalysisStubHandler } from './handler.ts';
import { createProviderReadinessHandler } from '../_shared/provider-readiness.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const key = publishableKey() || Deno.env.get('SUPABASE_ANON_KEY') || '';

function publishableKey(): string {
  try {
    const keys: unknown = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}');
    return keys && typeof keys === 'object' && 'default' in keys && typeof keys.default === 'string'
      ? keys.default
      : '';
  } catch {
    return '';
  }
}

function serverSecretKey(): string {
  try {
    const keys: unknown = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    return keys && typeof keys === 'object' && 'default' in keys && typeof keys.default === 'string'
      ? keys.default
      : '';
  } catch {
    return '';
  }
}

// Analysis remains disabled: IMP-070 catalog and Gate 2 review are pending.
// This handler has no draft catalog, provider key, service_role or writes.
// Keep the catalog absent until its human-reviewed source is implemented.
const analysisHandler = createAnalysisStubHandler((authorization) => {
  if (!url || !key) return null;
  const client = createClient(url, key, {
    global: {
      headers: { Authorization: authorization },
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(15000),
        }),
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    async authenticate(signal) {
      // getUser validates the JWT on Auth; no trust in locally decoded claims.
      signal.throwIfAborted();
      const { data, error } = await client.auth.getUser(authorization.slice(7));
      signal.throwIfAborted();
      return error ? null : (data.user?.id ?? null);
    },
    async observation(id, owner, signal) {
      const { data, error } = await client
        .from('observations')
        .select('id,user_id,lifecycle,publication,analysis_status,photo_source')
        .eq('id', id)
        .eq('user_id', owner)
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw new Error('observation_unavailable');
      return data;
    },
    async image(id, owner, signal) {
      const { data, error } = await client
        .from('observation_images')
        .select('id,owner_id,object_path,mime_type,bytes,position,photo_source')
        .eq('observation_id', id)
        .eq('owner_id', owner)
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw new Error('image_unavailable');
      return data;
    },
    async download(path, signal) {
      const { data, error } = await client.storage
        .from('observation-images')
        .download(path, {}, { signal, cache: 'no-store' });
      if (error) throw new Error('image_unavailable');
      return data;
    },
  };
}, null);

// Administrative metadata request only. No generation, photo access or writes.
// The gateway keeps JWT verification enabled; regular users cannot use this route.
const readinessHandler = createProviderReadinessHandler({
  operatorKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  additionalOperatorKeys: [serverSecretKey()],
  providerKey: Deno.env.get('MISTRAL_API_KEY') ?? '',
});
Deno.serve((request) =>
  new URL(request.url).pathname.endsWith('/analyze-observation/provider-readiness')
    ? readinessHandler(request)
    : analysisHandler(request),
);
