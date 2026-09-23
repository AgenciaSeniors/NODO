"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseProductForm, type FieldErrors } from "@/lib/listing-input";
import { DEMO_MODE } from "@/lib/mode";
import { toE164 } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { randomToken, readPhotoPairs, uploadPhotoPair } from "@/lib/supabase/uploads";

export type PublishResult = { error?: string; errors?: FieldErrors; published?: boolean };

const MAX_PHOTOS = 6;
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export async function publishProduct(data: FormData): Promise<PublishResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión se cerró. Vuelve a entrar para publicar." };

  const sellerKey = String(data.get("vendedor") ?? "me");
  const store = viewer.stores.find((s) => s.slug === sellerKey);
  if (sellerKey !== "me" && !store && !(DEMO_MODE && sellerKey === "nueva")) {
    return { error: "No administras esa tienda. Elige otro vendedor." };
  }
  const { input, errors } = parseProductForm(data);
  if (!input) return { errors, error: Object.values(errors)[0] };
  const photos = await readPhotoPairs(data, MAX_PHOTOS);
  if (photos === "invalid") return { error: "Alguna foto no se pudo leer. Quítala y vuelve a agregarla." };

  // The example version stops here: nothing is stored.
  if (DEMO_MODE) return { published: true };

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      owner_user_id: store ? null : viewer.id,
      owner_store_id: store?.id ?? null,
      title: input.title,
      description: input.description,
      category: input.category,
      condition: input.condition,
      price: input.price,
      currency: input.currency,
      sale_mode: input.saleMode,
      min_qty: input.minQty,
      availability: "available",
      province_id: input.provinceId,
      municipality_id: input.municipalityId,
      // Store products follow the store's number and terms unless changed here.
      whatsapp: store && toE164(store.whatsapp) === input.whatsapp ? null : input.whatsapp,
      payment: store && sameSet(store.payment, input.payment) ? null : input.payment,
      delivery: store && sameSet(store.delivery, input.delivery) ? null : input.delivery,
    })
    .select("id")
    .single();
  if (!product) {
    if (error?.message.includes("listing_limit_reached")) {
      return {
        error: `Llegaste a las ${viewer.plan.limit} publicaciones activas del ${viewer.plan.name}. Marca alguna como vendida para publicar otra.`,
      };
    }
    console.error(`[supabase] publish: ${error?.code} ${error?.message}`);
    return { error: "No pudimos publicar. Revisa tu conexión y vuelve a intentarlo." };
  }

  if (input.tiers.length > 0) {
    const { error: tiersError } = await supabase
      .from("quantity_tiers")
      .insert(input.tiers.map((t) => ({ product_id: product.id, min_qty: t.minQty, unit_price: t.unitPrice })));
    if (tiersError) {
      // Without its price table the listing would show wrong prices: undo it.
      console.error(`[supabase] publish tiers: ${tiersError.message}`);
      await supabase.from("products").delete().eq("id", product.id);
      return { error: "No pudimos guardar los precios por cantidad. Vuelve a intentarlo." };
    }
  }

  if (photos.length > 0) {
    const folder = `${viewer.id}/${product.id}`;
    const paths = await Promise.all(photos.map((pair, i) => uploadPhotoPair(supabase, `${folder}/${i}-${randomToken()}`, pair)));
    const saved = paths.filter((p) => p !== null);
    if (saved.length > 0) {
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(saved.map((path, position) => ({ product_id: product.id, path, position })));
      if (imagesError) console.error(`[supabase] publish images: ${imagesError.message}`);
    }
  }

  redirect(`/producto/${product.id}?publicado=1`);
}
