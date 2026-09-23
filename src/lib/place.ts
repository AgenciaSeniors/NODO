import { formatDistance } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";

/**
 * Where something is, in a few characters: the distance when we know it
 * (example content), otherwise the municipality. Real listings never reveal
 * more than the municipality.
 */
export function nearLabel(item: { distanceKm?: number; provinceId: string; municipalityId: string }): string {
  if (item.distanceKm !== undefined) return formatDistance(item.distanceKm);
  return findMunicipality(item.provinceId, item.municipalityId)?.name ?? findProvince(item.provinceId)?.name ?? "";
}
