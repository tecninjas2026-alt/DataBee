export type Step = 'observation' | 'location' | 'upload' | 'metadata';
export interface SeedSet {
  role: 'A' | 'B';
  owner_id: string;
  observation_id: string;
  image_id: string;
  bucket: string;
  object_path: string;
  synthetic_location: { latitude: number; longitude: number; location_source: 'user_informed'; accuracy: null; consent_at: null };
  progress: Record<Step, 'planned' | 'pending' | 'confirmed'>;
}
export interface SeedManifest {
  run_id: string;
  dataset_label: 'TEST DATA';
  project_ref: string;
  fixture: { bytes: number; mime: string; sha256: string };
  sets: [SeedSet, SeedSet];
}
export type RecordCheck = (id: string, passed: boolean) => void;
