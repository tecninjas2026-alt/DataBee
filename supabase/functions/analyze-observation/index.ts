import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { createAnalysisStubHandler, createLiveAnalysisHandler, type AnalysisStubReads } from './handler.ts';
import { createProviderReadinessHandler } from '../_shared/provider-readiness.ts';
import { createMistralVisionProvider } from '../_shared/mistral-vision.ts';
import { createSqlBeeAttemptStore } from '../_shared/bee-attempt-store.ts';
import { executeBeeAnalysis } from '../_shared/bee-execution.ts';
import { PROTOTYPE_SPECIES_CATALOG } from '../../catalog/prototype-species.ts';

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

// Participant reads remain RLS-bound; privileged writes use the narrow SQL RPCs below.
// Live analysis requires the explicitly approved catalog and restricted pilot configuration.
const readsFor = (authorization: string): AnalysisStubReads | null => {
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
};

const reviewed = Deno.env.get('BEE_AI_REVIEWED_SCOPE') === 'restricted-prototype-2026-10-29';
const allowedOwners = new Set(
  (Deno.env.get('BEE_AI_ALLOWED_USERS') ?? '').split(',').filter((value) => /^[0-9a-f-]{36}$/i.test(value)),
);
const enabled = Deno.env.get('BEE_AI_ENABLED') === 'true' && reviewed && allowedOwners.size > 0;
const provider = createMistralVisionProvider(
  {
    enabled,
    freeModeVerified: Deno.env.get('BEE_AI_FREE_MODE_VERIFIED') === 'true',
    apiTrainingDisabled: Deno.env.get('BEE_AI_TRAINING_DISABLED') === 'true',
    audienceAndTermsReviewed: reviewed,
    modelCapabilitiesVerified: Deno.env.get('BEE_AI_MODEL_VERIFIED') === 'true',
    apiKey: (Deno.env.get('MISTRAL_API_KEY') ?? '').trim(),
    model: Deno.env.get('MISTRAL_MODEL') ?? '',
  },
  PROTOTYPE_SPECIES_CATALOG,
);
const serverKey = serverSecretKey() || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const privileged =
  enabled && url && serverKey
    ? createClient(url, serverKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
const store = privileged
  ? createSqlBeeAttemptStore(async (name, args) => {
      const { data, error } = await privileged.rpc(name, args).abortSignal(AbortSignal.timeout(12000));
      if (error) throw new Error('analysis_store_unavailable');
      return data as unknown;
    }, PROTOTYPE_SPECIES_CATALOG)
  : null;
const analysisHandler =
  enabled && store
    ? createLiveAnalysisHandler(
        readsFor,
        PROTOTYPE_SPECIES_CATALOG,
        (input) => executeBeeAnalysis({ ...input, provider, store, catalog: PROTOTYPE_SPECIES_CATALOG }),
        (owner) => allowedOwners.has(owner),
      )
    : createAnalysisStubHandler(readsFor, null);

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
