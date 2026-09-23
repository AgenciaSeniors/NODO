import type { Product } from "@/lib/types";

/** The one label a product card shows. Paid placement always wins so it's never hidden. */
export function productBadge(product: Product): string | null {
  if (product.sponsored) return "Destacado";
  if (product.offerPrice !== undefined) return "Oferta";
  if (product.saleMode !== "unit") return "Por cantidad";
  if (product.seller.type === "store") return "Tienda";
  if (product.delivery.includes("delivery")) return "Domicilio";
  return null;
}
