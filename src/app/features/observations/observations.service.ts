import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { OBSERVATION_STORAGE } from '../../core/config/observation-storage';
import { AppError } from '../../core/errors/app-error';
import {
  AnalysisStatus,
  Observation,
  ObservationImage,
  ObservationPrivateLocation,
} from '../../core/models/observation.model';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface PrivateObservationDetail {
  observation: Observation;
  location: ObservationPrivateLocation | null;
}
export const ANALYSIS_LABELS: Record<AnalysisStatus, string> = {
  idle: 'Não analisada',
  processing: 'Análise em andamento',
  completed: 'Sugestão disponível',
  inconclusive: 'Análise inconclusiva',
  failed: 'Análise não concluída',
};

/** Consultas do próprio usuário; a proteção efetiva continua sendo o RLS. */
@Injectable({ providedIn: 'root' })
export class ObservationsService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  async countSaved(signal: AbortSignal): Promise<number> {
    const owner = this.owner();
    const { count, error } = await this.supabase.client
      .from('observations')
      .select('id', { head: true, count: 'exact' })
      .eq('user_id', owner)
      .eq('lifecycle', 'saved')
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(20_000)]));
    this.assertOwner(owner, signal);
    if (error || count === null) throw this.unavailable();
    return count;
  }

  async list(lifecycle: 'saved' | 'draft', offset: number, signal: AbortSignal): Promise<Observation[]> {
    const owner = this.owner();
    const { data, error } = await this.supabase.client
      .from('observations')
      .select('*')
      .eq('user_id', owner)
      .eq('lifecycle', lifecycle)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + 19)
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(20_000)]));
    this.assertOwner(owner, signal);
    if (error) throw this.unavailable();
    return (data ?? []) as Observation[];
  }

  async detail(id: string, signal: AbortSignal): Promise<PrivateObservationDetail | null> {
    const owner = this.owner();
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const { data: observation, error } = await this.supabase.client
      .from('observations')
      .select('*')
      .eq('id', id)
      .eq('user_id', owner)
      .eq('lifecycle', 'saved')
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(20_000)]))
      .maybeSingle<Observation>();
    this.assertOwner(owner, signal);
    if (error) throw this.unavailable();
    if (!observation) return null;
    const { data: location, error: locationError } = await this.supabase.client
      .from('observation_private_locations')
      .select('*')
      .eq('observation_id', id)
      .eq('owner_id', owner)
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(20_000)]))
      .maybeSingle<ObservationPrivateLocation>();
    this.assertOwner(owner, signal);
    if (locationError) throw this.unavailable();
    return { observation, location };
  }

  async imageUrl(id: string, signal: AbortSignal): Promise<string> {
    const owner = this.owner();
    const { data: image, error } = await this.supabase.client
      .from('observation_images')
      .select('*')
      .eq('observation_id', id)
      .eq('owner_id', owner)
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(20_000)]))
      .maybeSingle<ObservationImage>();
    this.assertOwner(owner, signal);
    if (
      error ||
      !image ||
      image.object_path !== `${owner}/${id}/${image.id}${image.mime_type === 'image/png' ? '.png' : '.jpg'}`
    )
      throw this.unavailable();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      this.supabase.client.storage.from(OBSERVATION_STORAGE.bucketId).createSignedUrl(image.object_path, 60),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(this.unavailable()), 20_000);
      }),
    ]).finally(() => {
      if (timer !== undefined) clearTimeout(timer);
    });
    this.assertOwner(owner, signal);
    if (result.error || !result.data?.signedUrl) throw this.unavailable();
    return result.data.signedUrl;
  }

  private owner(): string {
    const id = this.auth.user()?.id;
    if (!id) throw this.unavailable();
    return id;
  }
  private assertOwner(owner: string, signal: AbortSignal): void {
    if (signal.aborted || this.auth.user()?.id !== owner) throw this.unavailable();
  }
  private unavailable(): AppError {
    return new AppError('network', 'Não foi possível carregar o registro. Confira a conexão e tente novamente.');
  }
}
