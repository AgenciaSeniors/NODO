"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCATION_COOKIE, safeReturnPath, serializeLocation } from "@/lib/location";

export type LocationFormState = { error?: string };

export async function saveLocation(_prev: LocationFormState, formData: FormData): Promise<LocationFormState> {
  const province = String(formData.get("provincia") ?? "");
  const municipality = String(formData.get("municipio") ?? "") || undefined;
  const value = serializeLocation(province, municipality);
  if (!value) return { error: "Elige una provincia válida." };

  const store = await cookies();
  store.set(LOCATION_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  redirect(safeReturnPath(formData.get("volver")));
}
