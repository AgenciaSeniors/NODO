import { cache } from "react";
import { DEMO_STORES, demoProducts } from "@/lib/demo/data";
import { DEMO_MODE, SHOW_EXAMPLES } from "@/lib/mode";
import {
  refineProducts,
  refineStores,
  type ProductFilters,
  type StoreFilters,
} from "@/lib/refine";
import { isUuid } from "@/lib/search";
import {
  fetchOwnProducts,
  fetchProduct,
  fetchProducts,
  fetchProductsByIds,
  fetchStore,
  fetchStores,
} from "@/lib/supabase/queries";
import type { Product, Store } from "@/lib/types";

// Data access for the UI. Real content comes from Supabase; while NODO fills
// up, example content (tagged "Ejemplo") follows it. With NODO_MODE=demo the
// app runs on example content alone, without touching the database.

export type { Area, ProductFilter, ProductSort } from "@/lib/refine";

function exampleStores(): Store[] {
  return DEMO_STORES.map((s) => ({ ...s, example: !DEMO_MODE }));
}

function exampleProducts(): Product[] {
  const stores = exampleStores();
  return demoProducts().map((p) => {
    const { seller } = p;
    return {
      ...p,
      example: !DEMO_MODE,
      seller: seller.type === "store" ? { ...seller, store: stores.find((s) => s.id === seller.storeId) } : seller,
    };
  });
}

const useDatabase = !DEMO_MODE;

export async function listStores(filters: StoreFilters = {}): Promise<Store[]> {
  const [live, examples] = await Promise.all([
    // Real stores can't be featured yet (that will be a paid placement).
    useDatabase && !filters.featured ? fetchStores(filters) : [],
    SHOW_EXAMPLES ? exampleStores() : [],
  ]);
  return [...refineStores(live, filters), ...refineStores(examples, filters)];
}

export const getStore = cache(async (slug: string): Promise<Store | undefined> => {
  const live = useDatabase ? await fetchStore({ slug }) : undefined;
  return live ?? (SHOW_EXAMPLES ? exampleStores().find((s) => s.slug === slug) : undefined);
});

export const getStoreById = cache(async (id: string): Promise<Store | undefined> => {
  if (isUuid(id)) return useDatabase ? fetchStore({ id }) : undefined;
  return SHOW_EXAMPLES ? exampleStores().find((s) => s.id === id) : undefined;
});

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const exampleStore = filters.storeId !== undefined && !isUuid(filters.storeId);
  const [live, examples] = await Promise.all([
    // Nobody can pay for placement yet, so only example content is sponsored.
    useDatabase && !filters.sponsored && !exampleStore ? fetchProducts(filters) : [],
    SHOW_EXAMPLES && (filters.storeId === undefined || exampleStore) ? exampleProducts() : [],
  ]);
  // The database already applied the text search (with Spanish stemming).
  const all = [...refineProducts(live, { ...filters, q: undefined }), ...refineProducts(examples, filters)];
  return filters.limit ? all.slice(0, filters.limit) : all;
}

/** Saved products in the order they were saved, including sold ones. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const [live, examples] = await Promise.all([
    useDatabase ? fetchProductsByIds(ids.filter(isUuid)) : [],
    SHOW_EXAMPLES ? exampleProducts().filter((p) => ids.includes(p.id)) : [],
  ]);
  const byId = new Map([...live, ...examples].map((p) => [p.id, p]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export const getProduct = cache(async (id: string): Promise<Product | undefined> => {
  if (isUuid(id)) return useDatabase ? fetchProduct(id) : undefined;
  return SHOW_EXAMPLES ? exampleProducts().find((p) => p.id === id) : undefined;
});

/**
 * What a person sells privately, in every status. The example version shows
 * the example private listings as if they were the visitor's own.
 */
export async function getOwnListings(userId: string): Promise<Product[]> {
  if (DEMO_MODE) return exampleProducts().filter((p) => p.seller.type === "person");
  return fetchOwnProducts(userId);
}

export type SellerInfo = {
  name: string;
  whatsapp: string;
  store?: Store;
  rating?: number;
  memberSince?: string;
};

export async function getSeller(product: Product): Promise<SellerInfo> {
  if (product.seller.type === "person") {
    const { name, whatsapp, rating, memberSince } = product.seller;
    return { name, whatsapp, rating, memberSince };
  }
  const store = product.seller.store ?? (await getStoreById(product.seller.storeId));
  return { name: store?.name ?? "Tienda", whatsapp: product.whatsapp ?? store?.whatsapp ?? "", store };
}
