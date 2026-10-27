import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { createAnalysisStubHandler } from './handler.ts';

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

// LOCAL PREPARATION ONLY: IMP-070 catalog and Gate 2 review are pending.
// No draft catalog, provider key, service_role, writes or external AI calls.
// Keep the catalog absent until its human-reviewed source is implemented.
Deno.serve(
  createAnalysisStubHandler((authorization) => {
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
  }, null),
);
