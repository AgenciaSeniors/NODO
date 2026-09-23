import type { Product } from "@/lib/types";

export type TierRow = { range: string; unitPrice: number };

function span(from: number, to: number) {
  return to > from ? `${from}–${to}` : `${from}`;
}

/**
 * Price table rows. The base price covers quantities from 1 (or from the
 * minimum order when selling only in bulk) up to the first tier; then one row
 * per tier. A bulk-only product without tiers has no table: its minimum order
 * is shown on its own.
 */
export function tierRows(
  product: Pick<Product, "saleMode" | "tiers" | "price" | "offerPrice" | "minQty">,
): TierRow[] {
  if (product.saleMode === "unit") return [];
  const start = product.saleMode === "bulk_only" ? (product.minQty ?? 1) : 1;
  const tiers = [...product.tiers].filter((t) => t.minQty > start).sort((a, b) => a.minQty - b.minQty);
  if (tiers.length === 0) return [];
  const rows: TierRow[] = [{ range: span(start, tiers[0].minQty - 1), unitPrice: product.offerPrice ?? product.price }];
  tiers.forEach((tier, i) => {
    const next = tiers[i + 1];
    rows.push({ range: next ? span(tier.minQty, next.minQty - 1) : `${tier.minQty}+`, unitPrice: tier.unitPrice });
  });
  return rows;
}
