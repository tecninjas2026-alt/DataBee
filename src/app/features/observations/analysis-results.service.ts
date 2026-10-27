import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AppError } from '../../core/errors/app-error';
import type { AiIdentification } from '../../core/models/ai-identification.model';
import type { Observation } from '../../core/models/observation.model';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { validateBeeAnalysisStructure } from '../../../../supabase/functions/_shared/bee-analysis';

export type AnalysisObservation = Pick<Observation, 'id' | 'user_id' | 'analysis_status' | 'curation_status'>;
export interface SavedAnalysisView {
  observation: AnalysisObservation;
  identification: AiIdentification | null;
  simulated: boolean;
}

/** Reopening and retrying only read saved data. Never calls a provider or an Edge Function. */
@Injectable({ providedIn: 'root' })
export class AnalysisResultsService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  async read(id: string, signal: AbortSignal): Promise<SavedAnalysisView | null> {
    const owner = this.auth.user()?.id;
    if (!owner) throw this.unavailable();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(20_000)]);
    const assertCurrent = (): void => {
      if (requestSignal.aborted || owner !== this.auth.user()?.id) throw this.unavailable();
    };
    const { data: observation, error } = await this.supabase.client
      .from('observations')
      .select('id,user_id,analysis_status,curation_status')
      .eq('id', id)
      .eq('user_id', owner)
      .eq('lifecycle', 'saved')
      .abortSignal(requestSignal)
      .maybeSingle<AnalysisObservation>();
    assertCurrent();
    if (error) throw this.unavailable();
    if (!observation) return null;
    if (observation.analysis_status !== 'completed' && observation.analysis_status !== 'inconclusive') {
      return { observation, identification: null, simulated: false };
    }
    const { data: identification, error: resultError } = await this.supabase.client
      .from('ai_identifications')
      .select(
        'id,observation_id,provider,model,model_version,schema_version,prompt_version,catalog_version,result,created_at',
      )
      .eq('observation_id', id)
      .abortSignal(requestSignal)
      .maybeSingle<AiIdentification>();
    assertCurrent();
    if (resultError || !identification) throw this.unavailable();
    try {
      if (
        identification.schema_version !== '2.0' ||
        identification.observation_id !== id ||
        !Number.isFinite(Date.parse(identification.created_at))
      )
        throw this.unavailable();
      const result = validateBeeAnalysisStructure(identification.result);
      const expected = result.status === 'inconclusive' ? 'inconclusive' : 'completed';
      if (expected !== observation.analysis_status) throw this.unavailable();
      return {
        observation,
        identification: { ...identification, result },
        simulated: identification.provider === 'fixture' || identification.model.startsWith('SIMULATED-'),
      };
    } catch {
      throw this.unavailable();
    }
  }

  private unavailable(): AppError {
    return new AppError('unknown', 'Não foi possível carregar o resultado salvo. Tente novamente.');
  }
}
