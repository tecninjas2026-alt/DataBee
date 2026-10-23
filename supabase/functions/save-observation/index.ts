import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { validateJpeg } from '../_shared/validate-jpeg.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = defaultKey('SUPABASE_PUBLISHABLE_KEYS') || Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceKey = defaultKey('SUPABASE_SECRET_KEYS') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function defaultKey(name: string): string {
  try {
    const value: unknown = JSON.parse(Deno.env.get(name) ?? '{}');
    return value && typeof value === 'object' && 'default' in value && typeof value.default === 'string'
      ? value.default
      : '';
  } catch {
    return '';
  }
}

/** PROPOSTA LOCAL IMP-035: ainda não implantada. Nenhuma chamada à IA ou exclusão. */
Deno.serve(async (request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  const reply = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  const failure = (status: number, code: string, message: string): Response =>
    reply(status, { error: { code, message } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return failure(405, 'method_not_allowed', 'Use POST.');
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return failure(401, 'unauthorized', 'Entre na sua conta.');
  if (!url || !anonKey || !serviceKey)
    return failure(503, 'configuration_missing', 'Salvamento temporariamente indisponível.');
  try {
    // JWT do usuário para autenticar, consultar ownership e baixar a foto via RLS.
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: auth, error: authError } = await userClient.auth.getUser(authorization.slice(7));
    if (authError || !auth.user) return failure(401, 'unauthorized', 'Entre novamente na sua conta.');
    const text = await request.text();
    if (text.length > 1024) return failure(400, 'invalid_request', 'Pedido de salvamento inválido.');
    const body: unknown = JSON.parse(text);
    if (
      !body ||
      typeof body !== 'object' ||
      !('observation_id' in body) ||
      typeof body.observation_id !== 'string' ||
      !uuid.test(body.observation_id) ||
      Object.keys(body).length !== 1
    )
      return failure(400, 'invalid_request', 'Referência de observação inválida.');
    const id = body.observation_id;
    const { data: observation, error: observationError } = await userClient
      .from('observations')
      .select('id,user_id,photo_source,lifecycle,publication,analysis_status')
      .eq('id', id)
      .eq('user_id', auth.user.id)
      .abortSignal(AbortSignal.timeout(15000))
      .maybeSingle();
    if (observationError)
      return failure(503, 'read_unavailable', 'Não foi possível conferir a observação. Tente novamente.');
    if (!observation) return failure(404, 'not_found', 'Observação não encontrada.');
    if (
      observation.publication !== 'private' ||
      observation.analysis_status !== 'idle' ||
      !['draft', 'saved'].includes(observation.lifecycle)
    )
      return failure(409, 'state_conflict', 'Esta observação mudou. Reabra o registro.');
    const { data: image, error: imageError } = await userClient
      .from('observation_images')
      .select('id,owner_id,object_path,mime_type,bytes,photo_source,position')
      .eq('observation_id', id)
      .eq('owner_id', auth.user.id)
      .abortSignal(AbortSignal.timeout(15000))
      .maybeSingle();
    if (imageError) return failure(503, 'read_unavailable', 'Não foi possível conferir a foto. Tente novamente.');
    if (
      !image ||
      !uuid.test(image.id) ||
      image.object_path !== `${auth.user.id}/${id}/${image.id}.jpg` ||
      image.mime_type !== 'image/jpeg' ||
      !Number.isInteger(image.bytes) ||
      image.bytes < 1 ||
      image.bytes > 5242880 ||
      image.position !== 0 ||
      image.photo_source !== observation.photo_source
    ) {
      return failure(409, 'image_not_ready', 'Conclua o envio da foto antes de salvar.');
    }
    const { data: blob, error: downloadError } = await userClient.storage
      .from('observation-images')
      .download(image.object_path, {}, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    if (downloadError || !blob)
      return failure(503, 'image_unavailable', 'Não foi possível conferir o arquivo da foto. Tente novamente.');
    if (blob.type !== 'image/jpeg' || blob.size !== image.bytes)
      return failure(409, 'image_invalid', 'A foto não corresponde ao envio.');
    try {
      validateJpeg(new Uint8Array(await blob.arrayBuffer()));
    } catch {
      return failure(409, 'image_invalid', 'Escolha novamente uma foto tratada pelo app.');
    }
    // Privilégio elevado somente após autenticação, ownership e arquivo conferidos.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: saved, error: saveError } = await admin
      .rpc('save_validated_observation', {
        p_observation_id: id,
        p_owner_id: auth.user.id,
        p_image_id: image.id,
        p_bytes: image.bytes,
      })
      .abortSignal(AbortSignal.timeout(15000));
    if (saveError)
      return failure(409, 'save_unconfirmed', 'Salvamento não confirmado. Tente novamente com a mesma observação.');
    return reply(200, saved);
  } catch {
    return failure(
      400,
      'request_unconfirmed',
      'Não foi possível confirmar o pedido. Confira a conexão e tente novamente.',
    );
  }
});
