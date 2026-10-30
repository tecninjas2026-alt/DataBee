import { CURITIBA_REGION, GeoPoint, GeoRing } from './curitiba-region.data';

/** Frozen map-grid-2km-v1 projection. Never send a participant's exact point to a map provider. */
export const MAP_GRID_METERS = 2000;
export const MAP_X_METERS_PER_DEGREE = 111320 * Math.cos((25.4 * Math.PI) / 180);
export const MAP_Y_METERS_PER_DEGREE = 111320;

export function gridCellCenter(cellX: number, cellY: number): GeoPoint {
  if (!Number.isSafeInteger(cellX) || !Number.isSafeInteger(cellY)) throw new Error('invalid_map_cell');
  return [
    ((cellX + 0.5) * MAP_GRID_METERS) / MAP_X_METERS_PER_DEGREE,
    ((cellY + 0.5) * MAP_GRID_METERS) / MAP_Y_METERS_PER_DEGREE,
  ];
}

function insideRing(point: GeoPoint, ring: GeoRing): boolean {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
    if (
      Math.abs(cross) < 1e-10 &&
      x >= Math.min(xi, xj) &&
      x <= Math.max(xi, xj) &&
      y >= Math.min(yi, yj) &&
      y <= Math.max(yi, yj)
    )
      return true;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Cartographic containment only; simplified IBGE polygons are not a navigation/survey boundary. */
export function inCuritibaRegion(point: GeoPoint): boolean {
  if (!point.every(Number.isFinite)) return false;
  return CURITIBA_REGION.some((municipality) =>
    municipality.polygons.some(
      (polygon) => insideRing(point, polygon[0]) && !polygon.slice(1).some((ring) => insideRing(point, ring)),
    ),
  );
}
