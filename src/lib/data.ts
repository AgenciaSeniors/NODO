import { DEMO_STORES, DEMO_USER, demoProducts } from "@/lib/demo/data";
import { toCupEstimate } from "@/lib/format";
import type { Product, Store } from "@/lib/types";

// Data access for the UI. Today it reads the demo data; when Supabase is
// connected these functions become queries and the pages stay the same.

export type Area = { provinceId?: string; municipalityId?: string };

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(query: string | undefined, ...fields: string[]) {
  if (!query?.trim()) return true;
  const haystack = normalize(fields.join(" "));
  return normalize(query).split(/\s+/).every((word) => haystack.includes(word));
}

/** Same municipality first, then by distance. */
function byCloseness<T extends { municipalityId: string; distanceKm: number }>(area: Area) {
  return (a: T, b: T) => {
    const local = Number(b.municipalityId === area.municipalityId) - Number(a.municipalityId === area.municipalityId);
    return local || a.distanceKm - b.distanceKm;
  };
}

export async function listStores(
  filters: Area & { category?: string; q?: string; featured?: boolean; isNew?: boolean } = {},
): Promise<Store[]> {
  return DEMO_STORES.filter(
    (s) =>
      (!filters.provinceId || s.provinceId === filters.provinceId) &&
      (!filters.category || s.category === filters.category) &&
      (filters.featured === undefined || s.featured === filters.featured) &&
      (filters.isNew === undefined || s.isNew === filters.isNew) &&
      matches(filters.q, s.name, s.tagline, s.description),
  ).sort(byCloseness(filters));
}

export async function getStore(slug: string): Promise<Store | undefined> {
  return DEMO_STORES.find((s) => s.slug === slug);
}

export async function getStoreById(id: string): Promise<Store | undefined> {
  return DEMO_STORES.find((s) => s.id === id);
}

export type ProductSort = "recomendados" | "recientes" | "cerca" | "precio-asc" | "precio-desc";
export type ProductFilter = "tiendas" | "ofertas" | "cantidad" | "domicilio";

export async function listProducts(
  filters: Area & {
    category?: string;
    q?: string;
    storeId?: string;
    only?: ProductFilter[];
    sponsored?: boolean;
    sort?: ProductSort;
    limit?: number;
  } = {},
): Promise<Product[]> {
  const only = new Set(filters.only ?? []);
  const visible = demoProducts().filter((p) => {
    const store = p.seller.type === "store" ? DEMO_STORES.find((s) => s.id === (p.seller as { storeId: string }).storeId) : undefined;
    return (
      !["hidden", "archived", "draft", "sold"].includes(p.availability) &&
      (!filters.provinceId || p.provinceId === filters.provinceId) &&
      (!filters.category || p.category === filters.category) &&
      (!filters.storeId || store?.id === filters.storeId) &&
      (filters.sponsored === undefined || p.sponsored === filters.sponsored) &&
      (!only.has("tiendas") || p.seller.type === "store") &&
      (!only.has("ofertas") || p.offerPrice !== undefined) &&
      (!only.has("cantidad") || p.saleMode !== "unit") &&
      (!only.has("domicilio") || p.delivery.includes("delivery")) &&
      matches(filters.q, p.title, p.description, p.category, store?.name ?? "")
    );
  });

  const price = (p: Product) => toCupEstimate(p.offerPrice ?? p.price, p.currency);
  const sorters: Record<ProductSort, (a: Product, b: Product) => number> = {
    // First version of "recommended": closeness plus how fresh the availability is.
    recomendados: (a, b) =>
      a.distanceKm + ageHours(a.confirmedAt) / 24 - (b.distanceKm + ageHours(b.confirmedAt) / 24),
    recientes: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    cerca: byCloseness(filters),
    "precio-asc": (a, b) => price(a) - price(b),
    "precio-desc": (a, b) => price(b) - price(a),
  };
  const sorted = visible.sort(sorters[filters.sort ?? "recomendados"]);
  return filters.limit ? sorted.slice(0, filters.limit) : sorted;
}

function ageHours(date: Date) {
  return (Date.now() - date.getTime()) / 3_600_000;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return demoProducts().find((p) => p.id === id);
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
  const store = await getStoreById(product.seller.storeId);
  return { name: store?.name ?? "Tienda", whatsapp: store?.whatsapp ?? "", store };
}

export async function getCurrentUser() {
  const stores = DEMO_STORES.filter((s) => DEMO_USER.storeIds.includes(s.id));
  return { ...DEMO_USER, stores };
}
