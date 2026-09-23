import "server-only";
import type { Viewer } from "@/lib/auth";
import { thumbPath } from "@/lib/photos";
import type { createClient } from "@/lib/supabase/server";
import type { Store } from "@/lib/types";

type Client = Awaited<ReturnType<typeof createClient>>;

export type EditableListing = {
  id: string;
  ownerUserId: string | null;
  /** Set when the listing belongs to one of the viewer's stores. */
  store?: Store;
  availability: string;
  imagePaths: string[];
};

/**
 * A listing the viewer may change: their own, or one of a store they help run.
 * Row level security enforces the same rule; this gives a clear answer first.
 */
export async function findEditableListing(supabase: Client, viewer: Viewer, productId: string): Promise<EditableListing | null> {
  const { data, error } = await supabase
    .from("products")
    .select("id, owner_user_id, owner_store_id, availability, product_images (path, position)")
    .eq("id", productId)
    .maybeSingle();
  if (error) console.error(`[supabase] editable listing: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    owner_user_id: string | null;
    owner_store_id: string | null;
    availability: string;
    product_images: Array<{ path: string; position: number }> | null;
  };
  const store = viewer.stores.find((s) => s.id === row.owner_store_id);
  if (row.owner_user_id !== viewer.id && !store) return null;
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    store,
    availability: row.availability,
    imagePaths: [...(row.product_images ?? [])].sort((a, b) => a.position - b.position).map((i) => i.path),
  };
}

/** Deletes photos and their thumbnails. Best effort: a leftover file is harmless. */
export async function removePhotos(supabase: Client, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("product-images").remove(paths.flatMap((p) => [p, thumbPath(p)]));
  if (error) console.error(`[supabase] remove photos: ${error.message}`);
}
