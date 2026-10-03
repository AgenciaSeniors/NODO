"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseStoreForm, type FieldErrors } from "@/lib/listing-input";
import { DEMO_MODE } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import { randomToken, readImage, uploadImage } from "@/lib/supabase/uploads";

export type StoreResult = { error?: string; errors?: FieldErrors; notice?: string };

const MAX_LOGO_BYTES = 400_000;

/** Saves changes to a store the viewer helps run (name, logo, location, terms…). */
export async function updateStore(storeId: string, data: FormData): Promise<StoreResult> {
  const { input, errors } = parseStoreForm(data);
  if (!input) return { errors };

  if (DEMO_MODE) return { notice: "En la versión de prueba los cambios no se guardan." };

  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión se cerró. Vuelve a entrar para guardar los cambios." };
  const store = viewer.stores.find((s) => s.id === storeId);
  if (!store) return { error: "No encontramos esa tienda entre las tuyas." };

  const logo = await readImage(data.get("logo"), MAX_LOGO_BYTES);
  if (logo === "invalid") return { error: "No pudimos usar esa foto. Prueba con otra en JPG o PNG." };

  const supabase = await createClient();
  let logoPath: string | undefined;
  let previousLogoPath: string | null = null;
  if (logo) {
    const { data: current } = await supabase.from("stores").select("logo_path").eq("id", storeId).maybeSingle();
    previousLogoPath = (current?.logo_path as string | null) ?? null;
    const path = await uploadImage(supabase, "store-logos", `${viewer.id}/${storeId}-${randomToken()}`, logo);
    if (!path) return { error: "No pudimos guardar la foto. Vuelve a intentarlo." };
    logoPath = path;
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name: input.name,
      category: input.category,
      description: input.description,
      province_id: input.provinceId,
      municipality_id: input.municipalityId,
      address: input.address || null,
      whatsapp: input.whatsapp,
      hours: input.hours || null,
      payment: input.payment,
      delivery: input.delivery,
      ...(logoPath ? { logo_path: logoPath } : {}),
    })
    .eq("id", storeId);
  if (error) {
    console.error(`[supabase] update store: ${error.message}`);
    return { error: "No pudimos guardar los cambios. Revisa tu conexión y vuelve a intentarlo." };
  }

  // Best effort: a leftover logo file is harmless.
  if (logoPath && previousLogoPath) {
    const { error: removeError } = await supabase.storage.from("store-logos").remove([previousLogoPath]);
    if (removeError) console.error(`[supabase] remove old logo: ${removeError.message}`);
  }

  redirect(`/perfil/tiendas/${store.slug}/administrar?editado=1`);
}
