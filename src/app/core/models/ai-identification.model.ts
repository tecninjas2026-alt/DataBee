import type { BeeAnalysisV2 } from './bee-analysis.model';

/** IMP-026: linha de leitura. O cliente não recebe tipos de INSERT/UPDATE de resultado.
 * Uma sugestão automática nunca representa validação científica humana.
 */
export interface AiIdentification {
  readonly id: string;
  readonly observation_id: string;
  readonly provider: string;
  readonly model: string;
  readonly model_version: string | null;
  readonly schema_version: '2.0';
  readonly prompt_version: string;
  readonly catalog_version: string;
  readonly result: BeeAnalysisV2;
  readonly created_at: string;
}
