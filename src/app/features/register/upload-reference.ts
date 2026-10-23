import { PhotoSource } from '../../core/models/observation.model';

/** Só etiquetas de recuperação. Nunca guardar foto, GPS, sessão ou URL assinada aqui. */
export interface UploadReference {
  version: 1;
  ownerId: string;
  observationId: string;
  imageId: string;
  sha256: string;
  bytes: number;
  source: PhotoSource;
  capturedAt: string | null;
  consentAt: string | null;
  withLocation: boolean;
  stage: 'reserved' | 'draft' | 'location' | 'file' | 'metadata' | 'ready';
}

export function uploadPath(reference: UploadReference): string {
  return `${reference.ownerId}/${reference.observationId}/${reference.imageId}.jpg`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STAGES: readonly unknown[] = ['reserved', 'draft', 'location', 'file', 'metadata', 'ready'];

/** O armazenamento local também é entrada não confiável: não aceitar caminhos arbitrários. */
export function isUploadReference(value: unknown, owner: string): value is UploadReference {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<UploadReference>;
  const date = (text: unknown): boolean => typeof text === 'string' && Number.isFinite(Date.parse(text));
  return (
    item.version === 1 &&
    item.ownerId === owner &&
    UUID.test(owner) &&
    typeof item.observationId === 'string' &&
    UUID.test(item.observationId) &&
    typeof item.imageId === 'string' &&
    UUID.test(item.imageId) &&
    typeof item.sha256 === 'string' &&
    /^[0-9a-f]{64}$/.test(item.sha256) &&
    typeof item.bytes === 'number' &&
    Number.isInteger(item.bytes) &&
    item.bytes > 0 &&
    item.bytes <= 5242880 &&
    (item.source === 'camera' || item.source === 'gallery') &&
    (item.capturedAt === null || date(item.capturedAt)) &&
    (item.consentAt === null || date(item.consentAt)) &&
    typeof item.withLocation === 'boolean' &&
    STAGES.includes(item.stage) &&
    (item.source !== 'gallery' || (item.capturedAt === null && !item.withLocation)) &&
    (!item.withLocation || item.consentAt !== null)
  );
}

export async function photoDigest(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
