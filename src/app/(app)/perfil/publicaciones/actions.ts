"use server";

import { refresh } from "next/cache";
import { getViewer } from "@/lib/auth";
import { PERSON_STATUSES, STORE_STATUSES } from "@/lib/listing-status";
import { DEMO_MODE } from "@/lib/mode";
import { isUuid } from "@/lib/search";
import { findEditableListing, removePhotos } from "@/lib/supabase/listings";
import { createClient } from "@/lib/supabase/server";
import type { Availability } from "@/lib/types";

export type ListingResult = { error?: string; notice?: string };

const DEMO_NOTICE: ListingResult = { notice: "En la versión de prueba los cambios no se guardan." };
const NOT_YOURS: ListingResult = { error: "No encontramos esa publicación entre las tuyas." };
const OFFLINE: ListingResult = { error: "No pudimos guardar el cambio. Revisa tu conexión y vuelve a intentarlo." };

async function open(productId: string) {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, result: { error: "Tu sesión se cerró. Vuelve a entrar." } } as const;
  if (!isUuid(productId)) return { ok: false, result: NOT_YOURS } as const;
  const supabase = await createClient();
  const listing = await findEditableListing(supabase, viewer, productId);
  return listing ? ({ ok: true, viewer, supabase, listing } as const) : ({ ok: false, result: NOT_YOURS } as const);
}

/** Disponible, reservado, vendido, archivado… (for stores: pocas unidades, agotado, oculto). */
export async function setListingStatus(productId: string, status: Availability): Promise<ListingResult> {
  if (DEMO_MODE) return DEMO_NOTICE;
  const ctx = await open(productId);
  if (!ctx.ok) return ctx.result;
  const allowed: readonly Availability[] = ctx.listing.store ? STORE_STATUSES : PERSON_STATUSES;
  if (!allowed.includes(status)) return { error: "Ese estado no se puede usar aquí." };

  const { error } = await ctx.supabase.from("products").update({ availability: status }).eq("id", productId);
  if (error) {
    if (error.message.includes("listing_limit_reached")) {
      const { plan } = ctx.viewer;
      return { error: `Ya tienes ${plan.limit} publicaciones activas, el máximo del ${plan.name}. Marca otra como vendida o archívala primero.` };
    }
    console.error(`[supabase] listing status: ${error.message}`);
    return OFFLINE;
  }
  refresh();
  return {};
}

/** "Sigue disponible": resets "confirmado hace…" without changing anything else. */
export async function confirmListing(productId: string): Promise<ListingResult> {
  if (DEMO_MODE) return DEMO_NOTICE;
  const ctx = await open(productId);
  if (!ctx.ok) return ctx.result;
  const { error } = await ctx.supabase.from("products").update({ confirmed_at: new Date().toISOString() }).eq("id", productId);
  if (error) {
    console.error(`[supabase] confirm listing: ${error.message}`);
    return OFFLINE;
  }
  refresh();
  return {};
}

/** Deletes the listing, its prices by quantity and its photos. */
export async function deleteListing(productId: string): Promise<ListingResult> {
  if (DEMO_MODE) return DEMO_NOTICE;
  const ctx = await open(productId);
  if (!ctx.ok) return ctx.result;
  const { error } = await ctx.supabase.from("products").delete().eq("id", productId);
  if (error) {
    console.error(`[supabase] delete listing: ${error.message}`);
    return OFFLINE;
  }
  await removePhotos(ctx.supabase, ctx.listing.imagePaths);
  refresh();
  return {};
}
