"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseStoreForm, type FieldErrors } from "@/lib/listing-input";
import { DEMO_MODE } from "@/lib/mode";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { randomToken, readImage, uploadImage } from "@/lib/supabase/uploads";

export type CreateStoreResult = { error?: string; errors?: FieldErrors };

const MAX_LOGO_BYTES = 400_000;

export async function createStore(data: FormData): Promise<CreateStoreResult> {
  const { input, errors } = parseStoreForm(data);
  if (!input) return { errors };

  if (DEMO_MODE) {
    // Nothing is stored: the confirmation screen shows what was typed.
    const { name, category, provinceId, municipalityId, whatsapp } = input;
    const params = new URLSearchParams({ nombre: name, categoria: category, provincia: provinceId, municipio: municipalityId, whatsapp });
    redirect(`/perfil/tiendas/creada?${params}`);
  }

  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión se cerró. Vuelve a entrar para crear la tienda." };
  const logo = await readImage(data.get("logo"), MAX_LOGO_BYTES);
  if (logo === "invalid") return { error: "No pudimos usar esa foto. Prueba con otra en JPG o PNG." };

  const supabase = await createClient();
  const base = slugify(input.name).slice(0, 60).replace(/-+$/, "") || "tienda";
  let store: { id: string; slug: string } | null = null;
  // The address of the store is its name; if it's taken, add a short suffix.
  for (let attempt = 0; attempt < 4 && !store; attempt++) {
    const { data: row, error } = await supabase
      .from("stores")
      .insert({
        slug: attempt === 0 ? base : `${base}-${randomToken(4)}`,
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
      })
      .select("id, slug")
      .single();
    if (row) store = row;
    else if (error?.code !== "23505") {
      console.error(`[supabase] create store: ${error?.code} ${error?.message}`);
      return { error: "No pudimos crear la tienda. Revisa tu conexión y vuelve a intentarlo." };
    }
  }
  if (!store) return { error: "No pudimos crear la tienda. Vuelve a intentarlo." };

  if (logo) {
    const path = await uploadImage(supabase, "store-logos", `${viewer.id}/${store.id}-${randomToken()}`, logo);
    if (path) {
      const { error } = await supabase.from("stores").update({ logo_path: path }).eq("id", store.id);
      if (error) console.error(`[supabase] store logo: ${error.message}`);
    }
  }
  redirect(`/perfil/tiendas/creada?${new URLSearchParams({ tienda: store.slug })}`);
}
