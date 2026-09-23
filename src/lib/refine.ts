import { toCupEstimate } from "@/lib/format";
import { matches } from "@/lib/search";
import type { Product, Store } from "@/lib/types";

// Filtering and ordering shared by example content and database rows, so both
// behave the same in every list.

export type Area = { provinceId?: string; municipalityId?: string };

export type StoreFilters = Area & { category?: string; q?: string; featured?: boolean; isNew?: boolean };

export type ProductSort = "recomendados" | "recientes" | "cerca" | "precio-asc" | "precio-desc";
export type ProductFilter = "tiendas" | "ofertas" | "cantidad" | "domicilio";

export type ProductFilters = Area & {
  category?: string;
  q?: string;
  storeId?: string;
  only?: ProductFilter[];
  sponsored?: boolean;
  sort?: ProductSort;
  limit?: number;
};

/** Same municipality first, then by distance when it is known. */
function byCloseness<T extends { municipalityId: string; distanceKm?: number }>(area: Area) {
  return (a: T, b: T) => {
    const local = Number(b.municipalityId === area.municipalityId) - Number(a.municipalityId === area.municipalityId);
    return local || (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
  };
}

export function refineStores(stores: Store[], filters: StoreFilters): Store[] {
  return stores
    .filter(
      (s) =>
        (!filters.provinceId || s.provinceId === filters.provinceId) &&
        (!filters.category || s.category === filters.category) &&
        (filters.featured === undefined || s.featured === filters.featured) &&
        (filters.isNew === undefined || s.isNew === filters.isNew) &&
        matches(filters.q, s.name, s.tagline, s.description),
    )
    .sort(byCloseness(filters));
}

const NOT_LISTED = new Set(["hidden", "archived", "draft", "sold"]);

function ageHours(date: Date) {
  return (Date.now() - date.getTime()) / 3_600_000;
}

export function refineProducts(products: Product[], filters: ProductFilters): Product[] {
  const only = new Set(filters.only ?? []);
  const visible = products.filter((p) => {
    const store = p.seller.type === "store" ? p.seller : undefined;
    return (
      !NOT_LISTED.has(p.availability) &&
      (!filters.provinceId || p.provinceId === filters.provinceId) &&
      (!filters.category || p.category === filters.category) &&
      (!filters.storeId || store?.storeId === filters.storeId) &&
      (filters.sponsored === undefined || p.sponsored === filters.sponsored) &&
      (!only.has("tiendas") || store !== undefined) &&
      (!only.has("ofertas") || p.offerPrice !== undefined) &&
      (!only.has("cantidad") || p.saleMode !== "unit") &&
      (!only.has("domicilio") || p.delivery.includes("delivery")) &&
      matches(filters.q, p.title, p.description, p.category, store?.store?.name ?? "")
    );
  });

  const price = (p: Product) => toCupEstimate(p.offerPrice ?? p.price, p.currency);
  const sorters: Record<ProductSort, (a: Product, b: Product) => number> = {
    // First version of "recommended": closeness plus how fresh the availability is.
    recomendados: (a, b) =>
      (a.distanceKm ?? 0) + ageHours(a.confirmedAt) / 24 - ((b.distanceKm ?? 0) + ageHours(b.confirmedAt) / 24),
    recientes: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    cerca: byCloseness(filters),
    "precio-asc": (a, b) => price(a) - price(b),
    "precio-desc": (a, b) => price(b) - price(a),
  };
  return visible.sort(sorters[filters.sort ?? "recomendados"]);
}
