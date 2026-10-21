import { APP_CONFIG } from './app-config';

/** IMP-015 — contrato do bucket privado; segurança efetiva nas políticas do Supabase. */
export const OBSERVATION_STORAGE = Object.freeze({
  bucketId: 'observation-images',
  maxBytes: APP_CONFIG.maxPhotoBytes,
  allowedMimeTypes: ['image/jpeg', 'image/png'] as const,
});
