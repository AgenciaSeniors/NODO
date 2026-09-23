import "server-only";
import { toPrefixQuery } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_COLUMNS, STORE_COLUMNS, toProduct, toStore, type ProductRow, type StoreRow } from "@/lib/supabase/rows";
import type { Product, Store } from "@/lib/types";

// Reads from the database. The database narrows by area, category and search;
// the finer filters and the ordering happen in refine.ts so real and example
// content behave the same. A failed query logs and yields nothing, so a slow
// or unreachable database degrades to an empty list instead of an error page.

const NOT_LISTED = "(draft,hidden,archived,sold)";
// Enough for the first months; beyond that, move the remaining filters and
// the ordering into SQL.
const MAX_ROWS = 200;

function logError(what: string, error: { message: string } | null) {
  if (error) console.error(`[supabase] ${what}: ${error.message}`);
}

export async function fetchProducts(filters: {
  provinceId?: string;
  category?: string;
  storeId?: string;
  q?: string;
}): Promise<Product[]> {
  const search = filters.q?.trim() ? toPrefixQuery(filters.q) : null;
  if (filters.q?.trim() && !search) return [];

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .not("availability", "in", NOT_LISTED)
    .order("confirmed_at", { ascending: false })
    .limit(MAX_ROWS);
  if (filters.provinceId) query = query.eq("province_id", filters.provinceId);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.storeId) query = query.eq("owner_store_id", filters.storeId);
  if (search) query = query.textSearch("search", search, { config: "spanish" });

  const { data, error } = await query;
  logError("products", error);
  return ((data ?? []) as unknown as ProductRow[]).map(toProduct);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).in("id", ids);
  logError("products by id", error);
  return ((data ?? []) as unknown as ProductRow[]).map(toProduct);
}

export async function fetchProduct(id: string): Promise<Product | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  logError("product", error);
  return data ? toProduct(data as unknown as ProductRow) : undefined;
}

// Store cards show how many products are listed.
const STORE_WITH_COUNT = `${STORE_COLUMNS}, products (count)`;

export async function fetchStores(filters: { provinceId?: string; category?: string }): Promise<Store[]> {
  const supabase = await createClient();
  let query = supabase
    .from("stores")
    .select(STORE_WITH_COUNT)
    .eq("status", "active")
    .not("products.availability", "in", NOT_LISTED)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  if (filters.provinceId) query = query.eq("province_id", filters.provinceId);
  if (filters.category) query = query.eq("category", filters.category);
  const { data, error } = await query;
  logError("stores", error);
  return ((data ?? []) as unknown as StoreRow[]).map((row) => toStore(row));
}

export async function fetchStore(by: { slug: string } | { id: string }): Promise<Store | undefined> {
  const supabase = await createClient();
  let query = supabase.from("stores").select(STORE_WITH_COUNT).not("products.availability", "in", NOT_LISTED);
  query = "slug" in by ? query.eq("slug", by.slug) : query.eq("id", by.id);
  const { data, error } = await query.maybeSingle();
  logError("store", error);
  return data ? toStore(data as unknown as StoreRow) : undefined;
}

/** The number someone used on their last personal listing, to prefill the next one. */
export async function fetchLastPersonalWhatsapp(userId: string): Promise<string | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("whatsapp")
    .eq("owner_user_id", userId)
    .not("whatsapp", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  logError("last whatsapp", error);
  return (data?.whatsapp as string | undefined) ?? undefined;
}

/** Everything a person sells privately, drafts and sold items included (newest first). */
export async function fetchOwnProducts(userId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);
  logError("own products", error);
  return ((data ?? []) as unknown as ProductRow[]).map(toProduct);
}
