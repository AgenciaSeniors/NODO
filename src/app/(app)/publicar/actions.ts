"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseProductForm, type FieldErrors, type ProductInput } from "@/lib/listing-input";
import { DEMO_MODE } from "@/lib/mode";
import { toE164 } from "@/lib/phone";
import { isUuid } from "@/lib/search";
import { findEditableListing, removePhotos } from "@/lib/supabase/listings";
import { createClient } from "@/lib/supabase/server";
import { randomToken, readPhotoPairs, uploadPhotoPair, type PhotoPair } from "@/lib/supabase/uploads";
import type { Store } from "@/lib/types";

export type PublishResult = { error?: string; errors?: FieldErrors; published?: boolean };

const MAX_PHOTOS = 6;
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
const BAD_PHOTO = "Alguna foto no se pudo leer. Quítala y vuelve a agregarla.";

/** The columns both publishing and editing write. */
function listingValues(input: ProductInput, store?: Store) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    condition: input.condition,
    price: input.price,
    currency: input.currency,
    sale_mode: input.saleMode,
    min_qty: input.minQty,
    province_id: input.provinceId,
    municipality_id: input.municipalityId,
    // Store products follow the store's number and terms unless changed here.
    whatsapp: store && toE164(store.whatsapp) === input.whatsapp ? null : input.whatsapp,
    payment: store && sameSet(store.payment, input.payment) ? null : input.payment,
    delivery: store && sameSet(store.delivery, input.delivery) ? null : input.delivery,
  };
}

type Client = Awaited<ReturnType<typeof createClient>>;

async function uploadAll(supabase: Client, folder: string, photos: PhotoPair[]): Promise<string[]> {
  const paths = await Promise.all(photos.map((pair) => uploadPhotoPair(supabase, `${folder}/${randomToken(8)}`, pair)));
  return paths.filter((p) => p !== null);
}

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
  if (photos === "invalid") return { error: BAD_PHOTO };

  // The example version stops here: nothing is stored.
  if (DEMO_MODE) return { published: true };

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      owner_user_id: store ? null : viewer.id,
      owner_store_id: store?.id ?? null,
      availability: "available",
      ...listingValues(input, store),
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
    const saved = await uploadAll(supabase, `${viewer.id}/${product.id}`, photos);
    if (saved.length > 0) {
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(saved.map((path, position) => ({ product_id: product.id, path, position })));
      if (imagesError) console.error(`[supabase] publish images: ${imagesError.message}`);
    }
  }

  redirect(`/producto/${product.id}?publicado=1`);
}

/**
 * Saves changes to a listing. Photos the seller kept arrive as "mantener"
 * (their storage paths, in order), new ones as files; removed ones are deleted.
 * Saving also counts as confirming the listing is still available.
 */
export async function updateProduct(productId: string, data: FormData): Promise<PublishResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión se cerró. Vuelve a entrar para guardar los cambios." };
  const { input, errors } = parseProductForm(data);
  if (!input) return { errors, error: Object.values(errors)[0] };
  const photos = await readPhotoPairs(data, MAX_PHOTOS);
  if (photos === "invalid") return { error: BAD_PHOTO };
  if (DEMO_MODE) return { published: true };

  const supabase = await createClient();
  const listing = isUuid(productId) ? await findEditableListing(supabase, viewer, productId) : null;
  if (!listing) return { error: "No encontramos esa publicación entre las tuyas." };
  const keep = [...new Set(data.getAll("mantener").map(String))].filter((p) => listing.imagePaths.includes(p));
  if (keep.length + photos.length > MAX_PHOTOS) return { error: `Puedes tener hasta ${MAX_PHOTOS} fotos.` };

  const { error } = await supabase
    .from("products")
    .update({ ...listingValues(input, listing.store), confirmed_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) {
    console.error(`[supabase] update listing: ${error.message}`);
    return { error: "No pudimos guardar los cambios. Revisa tu conexión y vuelve a intentarlo." };
  }

  const { error: clearTiers } = await supabase.from("quantity_tiers").delete().eq("product_id", productId);
  const { error: tiersError } =
    clearTiers || input.tiers.length === 0
      ? { error: clearTiers }
      : await supabase
          .from("quantity_tiers")
          .insert(input.tiers.map((t) => ({ product_id: productId, min_qty: t.minQty, unit_price: t.unitPrice })));
  if (tiersError) {
    console.error(`[supabase] update tiers: ${tiersError.message}`);
    return { error: "Guardamos los cambios, pero no los precios por cantidad. Vuelve a intentarlo." };
  }

  const uploaded = await uploadAll(supabase, `${viewer.id}/${productId}`, photos);
  const ordered = [...keep, ...uploaded];
  const removed = listing.imagePaths.filter((p) => !keep.includes(p));
  const unchanged = removed.length === 0 && uploaded.length === 0 && keep.every((p, i) => listing.imagePaths[i] === p);
  if (!unchanged) {
    // Positions are unique per product, so the list is rewritten in its new order.
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (ordered.length > 0) {
      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(ordered.map((path, position) => ({ product_id: productId, path, position })));
      if (imagesError) console.error(`[supabase] update images: ${imagesError.message}`);
    }
    await removePhotos(supabase, removed);
  }

  redirect(`/producto/${productId}?editado=1`);
}
