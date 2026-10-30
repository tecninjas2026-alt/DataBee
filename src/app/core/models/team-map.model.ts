/** Contract proposed by IMP-066. RPCs remain unavailable until migration approval/application. */
export interface TeamMapCell {
  cell_x: number;
  cell_y: number;
  observations_count: number;
  analyzed_count: number;
  latest_day: string;
  own_count: number;
}
export interface OwnMapShare {
  is_shared: boolean;
  cell_x: number | null;
  cell_y: number | null;
  shared_at: string | null;
}
