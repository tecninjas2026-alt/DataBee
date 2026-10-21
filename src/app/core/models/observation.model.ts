/**
 * Tipos de domínio espelhando o Data Model do Notion ("Data Model e BeeAnalysisV2") e D21/D22.
 * Fonte de verdade do schema implementado = migrations em supabase/migrations.
 * Ao criar/alterar a tabela, atualize estes tipos no mesmo commit.
 */

export type ObservationLifecycle = 'draft' | 'saved';
export type ObservationPublication = 'private' | 'published';
/** completed = possible_match ou no_match válido; inconclusive = abstenção científica; failed = erro técnico. */
export type AnalysisStatus = 'idle' | 'processing' | 'completed' | 'inconclusive' | 'failed';
/** D22 — curadoria separada da análise. "Não analisada" é derivada de analysis_status = idle. */
export type CurationStatus = 'suggested' | 'in_review' | 'validated';
/** D21 */
export type PhotoSource = 'camera' | 'gallery';
export type LocationSource = 'device_gps' | 'image_metadata' | 'user_informed';
/** D10 — únicos rótulos públicos permitidos. */
export type PublicRegionLabel = 'Curitiba — PR' | 'Região Metropolitana de Curitiba (RMC) — PR';

export interface Observation {
  id: string;
  user_id: string;
  created_at: string;
  captured_at: string | null;
  photo_source: PhotoSource;
  lifecycle: ObservationLifecycle;
  publication: ObservationPublication;
  analysis_status: AnalysisStatus;
  curation_status: CurationStatus | null;
  analysis_started_at: string | null;
  public_region_label: PublicRegionLabel | null;
}

/** INSERT do cliente: estados, data de criação e campos públicos vêm somente do banco/backend. */
export interface ObservationDraftInsert {
  id?: string;
  user_id?: string;
  photo_source: PhotoSource;
  /** Omitir/null quando a data original não for confiável. */
  captured_at?: string | null;
}

export interface ObservationOwnerUpdate {
  captured_at?: string | null;
}

/** Linha privada (somente o dono lê). Nunca enviar ao VLM nem ao feed. */
export interface ObservationPrivateLocation {
  observation_id: string;
  owner_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  location_source: LocationSource;
  /** Obrigatório no banco para device_gps; outras origens podem não ter consentimento de GPS. */
  consent_at: string | null;
}

export interface ObservationPrivateLocationInsert {
  observation_id: string;
  owner_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  location_source: LocationSource;
  consent_at?: string | null;
}

export type ObservationPrivateLocationUpdate = Partial<
  Pick<ObservationPrivateLocation, 'latitude' | 'longitude' | 'accuracy' | 'location_source' | 'consent_at'>
>;

export interface ObservationImage {
  id: string;
  observation_id: string;
  owner_id: string;
  object_path: string;
  mime_type: 'image/jpeg' | 'image/png';
  bytes: number;
  position: number;
  created_at: string;
  /** Origem preservada mesmo após conversão/reencode do arquivo. */
  photo_source: PhotoSource;
}

/** IMP-014 — INSERT proposto. Gerar id antes para montar object_path; sem UPDATE/DELETE do cliente. */
export interface ObservationImageInsert {
  id: string;
  observation_id: string;
  owner_id?: string;
  object_path: string;
  mime_type: 'image/jpeg' | 'image/png';
  bytes: number;
  position?: number;
  photo_source: PhotoSource;
}

export interface Comment {
  id: string;
  observation_id: string;
  user_id: string;
  body: string;
  created_at: string;
}
