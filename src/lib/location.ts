import { cookies } from "next/headers";
import { findMunicipality, findProvince, type Municipality, type Province } from "@/lib/geo/cuba";

export const LOCATION_COOKIE = "nodo_ubicacion";

export type UserLocation = { province: Province; municipality?: Municipality };

/** Cookie value: "<provinceId>" or "<provinceId>/<municipalityId>". */
export function parseLocation(value: string | undefined): UserLocation | null {
  if (!value) return null;
  const [provinceId, municipalityId] = value.split("/");
  const province = findProvince(provinceId);
  if (!province) return null;
  const municipality = findMunicipality(provinceId, municipalityId);
  return { province, municipality };
}

export function serializeLocation(provinceId: string, municipalityId?: string): string | null {
  if (!findProvince(provinceId)) return null;
  if (municipalityId && !findMunicipality(provinceId, municipalityId)) return null;
  return municipalityId ? `${provinceId}/${municipalityId}` : provinceId;
}

export async function getLocation(): Promise<UserLocation | null> {
  const store = await cookies();
  return parseLocation(store.get(LOCATION_COOKIE)?.value);
}

export function locationLabel(location: UserLocation | null): string {
  if (!location) return "Elige tu ubicación";
  return location.municipality
    ? `${location.municipality.name}, ${location.province.name}`
    : `${location.province.name} · toda la provincia`;
}

/** Only same-site paths are accepted as a return target (no open redirects). */
export function safeReturnPath(value: FormDataEntryValue | string | null | undefined): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : "/";
}
