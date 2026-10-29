/** Server-only table; this type grants no participant read/write access. */
export interface AiAnalysisAttempt {
  id: string;
  observation_id: string;
  owner_id: string;
  schema_version: '2.0';
  prompt_version: string;
  catalog_version: string;
  started_at: string;
  finished_at: string | null;
  outcome: 'processing' | 'completed' | 'inconclusive' | 'failed';
}

/** Optional when a private observation projection omits server lease metadata. */
export interface ObservationAnalysisFence {
  analysis_attempt_id: string | null;
}
