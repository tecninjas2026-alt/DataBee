import { APP_CONFIG } from './app-config';

/** IMP-015 — contrato da proposta local; bucket remoto ainda não criado. */
export const OBSERVATION_STORAGE = Object.freeze({
  bucketId: 'observation-images',
  maxBytes: APP_CONFIG.maxPhotoBytes,
  allowedMimeTypes: ['image/jpeg', 'image/png'] as const,
});
