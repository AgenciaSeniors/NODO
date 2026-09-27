import type { Availability, Product } from "@/lib/types";

// What a seller can do with a listing's status. People sell single items
// (reserved → sold); stores manage stock. Mirrors the products_availability
// check in the database.

export const PERSON_STATUSES = ["available", "reserved", "sold", "archived"] as const satisfies Availability[];
export const STORE_STATUSES = ["available", "low_stock", "out_of_stock", "hidden"] as const satisfies Availability[];

/** Counted against the plan's limit of active listings. */
export const ACTIVE_STATUSES: Availability[] = ["available", "reserved"];

/** After a week without confirming, a listing asks its seller "¿Sigue disponible?". */
export const STALE_AFTER_DAYS = 7;

export function allowedStatuses(product: Pick<Product, "seller">): readonly Availability[] {
  return product.seller.type === "store" ? STORE_STATUSES : PERSON_STATUSES;
}

export function isStale(product: Pick<Product, "availability" | "confirmedAt">, now: Date = new Date()): boolean {
  const open = product.availability !== "sold" && product.availability !== "archived" && product.availability !== "hidden";
  return open && now.getTime() - product.confirmedAt.getTime() > STALE_AFTER_DAYS * 86_400_000;
}

export type ListingTab = "activas" | "vendidas" | "archivadas";

export function tabOf(product: Pick<Product, "availability">): ListingTab {
  if (product.availability === "sold") return "vendidas";
  if (product.availability === "archived" || product.availability === "draft") return "archivadas";
  return "activas";
}
