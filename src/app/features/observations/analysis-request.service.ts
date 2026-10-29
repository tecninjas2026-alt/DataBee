import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AppError } from '../../core/errors/app-error';
import { SupabaseService } from '../../core/supabase/supabase.service';

/** Only an explicit participant action requests analysis. Reads remain separate. */
@Injectable({ providedIn: 'root' })
export class AnalysisRequestService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  async analyze(id: string, signal: AbortSignal): Promise<void> {
    const owner = this.auth.user()?.id;
    if (!owner || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw this.failure();
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(65000)]);
    const { data, error } = await this.supabase.client.functions.invoke('analyze-observation', {
      body: { observation_id: id },
      signal: requestSignal,
      timeout: 65000,
    });
    if (requestSignal.aborted || this.auth.user()?.id !== owner) throw this.failure();
    if (error) {
      let code = '';
      try {
        const response: unknown = error.context instanceof Response ? await error.context.json() : null;
        if (
          response &&
          typeof response === 'object' &&
          'error' in response &&
          response.error &&
          typeof response.error === 'object' &&
          'code' in response.error &&
          typeof response.error.code === 'string'
        )
          code = response.error.code;
      } catch {
        /* Raw backend errors are never shown. */
      }
      const messages: Record<string, string> = {
        busy: 'A análise já está em andamento. Consulte o resultado em instantes.',
        limited: 'Limite de tentativas atingido. Guarde este registro e tente outra foto ou volte mais tarde.',
        pilot_restricted: 'A identificação está em teste orientado pela equipe. Seu registro continua salvo.',
        catalog_unavailable: 'A identificação está sendo preparada. Seu registro continua salvo.',
        configuration_missing: 'A identificação está sendo preparada. Seu registro continua salvo.',
        timeout: 'A análise demorou mais que o esperado. Consulte o resultado antes de tentar novamente.',
        cancelled: 'A solicitação foi interrompida. Consulte o resultado salvo antes de tentar novamente.',
      };
      throw new AppError(
        'unknown',
        messages[code] ?? 'Não foi possível concluir a análise. A foto e os dados continuam salvos.',
      );
    }
    const result: unknown = data;
    if (
      !result ||
      typeof result !== 'object' ||
      !('observation_id' in result) ||
      result.observation_id !== id ||
      !('status' in result) ||
      !['completed', 'inconclusive'].includes(String(result.status))
    )
      throw this.failure();
  }
  private failure(): AppError {
    return new AppError('unknown', 'Não foi possível confirmar a análise. Consulte o resultado salvo.');
  }
}
