import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AppError } from '../../core/errors/app-error';
import { OwnMapShare, TeamMapCell } from '../../core/models/team-map.model';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CURITIBA_REGION_BOUNDS } from './curitiba-region.data';
import { MAP_X_METERS_PER_DEGREE, MAP_Y_METERS_PER_DEGREE, MAP_GRID_METERS } from './curitiba-region.geometry';

/** Only coarse RPC projections. No private-location/photo/provider access on map reads. */
@Injectable({ providedIn: 'root' })
export class TeamMapService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  private async request(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<unknown> {
    const owner = this.auth.user()?.id;
    if (!owner || signal.aborted) throw this.unavailable();
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(20_000)]);
    const { data, error } = await this.supabase.client.rpc(name, args).abortSignal(requestSignal);
    if (requestSignal.aborted || owner !== this.auth.user()?.id) throw this.unavailable();
    if (error) {
      const messages: Record<string, string> = {
        saved_gps_required:
          'Este registro precisa de GPS salvo pela câmera para compartilhar uma área. A foto continua privada.',
        gps_accuracy_insufficient:
          'O GPS deste registro não tem precisão suficiente para o mapa. Você pode fazer outro registro com GPS ao ar livre.',
        outside_curitiba_region:
          'Este registro fica fora de Curitiba e da Região Metropolitana. Ele continua salvo em Minhas observações.',
        observation_not_found: 'O registro não foi encontrado ou não pertence à sua conta.',
      };
      throw new AppError(
        'unknown',
        messages[error.message] ?? 'Não foi possível acessar o mapa. Confira a conexão e tente novamente.',
      );
    }
    return data as unknown;
  }

  async list(after: TeamMapCell | null, signal: AbortSignal): Promise<TeamMapCell[]> {
    const data = await this.request(
      'list_map_cells',
      { p_after_x: after?.cell_x ?? null, p_after_y: after?.cell_y ?? null, p_limit: 250 },
      signal,
    );
    if (!Array.isArray(data) || data.length > 250) throw this.unavailable();
    let previous = after;
    return data.map((value: unknown) => {
      if (!value || typeof value !== 'object') throw this.unavailable();
      const cell = value as TeamMapCell;
      if (
        !this.validCell(cell.cell_x, cell.cell_y) ||
        ![cell.observations_count, cell.analyzed_count, cell.own_count].every(
          (n) => Number.isSafeInteger(n) && n >= 0,
        ) ||
        cell.observations_count < 1 ||
        cell.analyzed_count > cell.observations_count ||
        cell.own_count > cell.observations_count ||
        typeof cell.latest_day !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(cell.latest_day) ||
        !Number.isFinite(Date.parse(cell.latest_day)) ||
        (previous &&
          (cell.cell_x < previous.cell_x || (cell.cell_x === previous.cell_x && cell.cell_y <= previous.cell_y)))
      )
        throw this.unavailable();
      previous = cell;
      return {
        cell_x: cell.cell_x,
        cell_y: cell.cell_y,
        observations_count: cell.observations_count,
        analyzed_count: cell.analyzed_count,
        latest_day: cell.latest_day,
        own_count: cell.own_count,
      };
    });
  }

  async ownShare(id: string, signal: AbortSignal): Promise<OwnMapShare> {
    this.assertId(id);
    const data = await this.request('get_my_map_share', { p_observation_id: id }, signal);
    if (!Array.isArray(data) || data.length !== 1) throw this.unavailable();
    const row = data[0] as OwnMapShare;
    if (
      !row ||
      typeof row.is_shared !== 'boolean' ||
      (row.is_shared &&
        (!this.validCell(row.cell_x, row.cell_y) ||
          typeof row.shared_at !== 'string' ||
          !Number.isFinite(Date.parse(row.shared_at))))
    )
      throw this.unavailable();
    return {
      is_shared: row.is_shared,
      cell_x: row.is_shared ? row.cell_x : null,
      cell_y: row.is_shared ? row.cell_y : null,
      shared_at: row.is_shared ? row.shared_at : null,
    };
  }

  async setShare(id: string, share: boolean, signal: AbortSignal): Promise<void> {
    this.assertId(id);
    const data = await this.request('set_my_map_share', { p_observation_id: id, p_share: share }, signal);
    if (data !== share) throw this.unavailable();
  }

  private validCell(x: unknown, y: unknown): boolean {
    const [west, south, east, north] = CURITIBA_REGION_BOUNDS;
    return (
      typeof x === 'number' &&
      typeof y === 'number' &&
      Number.isSafeInteger(x) &&
      Number.isSafeInteger(y) &&
      x >= Math.floor((west * MAP_X_METERS_PER_DEGREE) / MAP_GRID_METERS) &&
      x <= Math.floor((east * MAP_X_METERS_PER_DEGREE) / MAP_GRID_METERS) &&
      y >= Math.floor((south * MAP_Y_METERS_PER_DEGREE) / MAP_GRID_METERS) &&
      y <= Math.floor((north * MAP_Y_METERS_PER_DEGREE) / MAP_GRID_METERS)
    );
  }
  private assertId(id: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw this.unavailable();
  }
  private unavailable(): AppError {
    return new AppError('unknown', 'Não foi possível confirmar os dados do mapa. Tente novamente.');
  }
}
