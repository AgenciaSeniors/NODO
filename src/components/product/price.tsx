import { formatPrice, toCupEstimate } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/cn";

/** The vendor's own CUP equivalent, when they said how they value their currency. */
function CupEstimate({ product }: { product: Product }) {
  if (product.currency === "CUP" || product.exchangeRate === undefined) return null;
  const cup = toCupEstimate(product.offerPrice ?? product.price, product.currency, product.exchangeRate);
  return (
    <span className="block text-sm font-normal text-muted">
      ≈ {formatPrice(cup, "CUP")} <span className="text-xs">(cambio del vendedor)</span>
    </span>
  );
}

export function Price({ product, className }: { product: Product; className?: string }) {
  const suffix = product.saleMode === "bulk_only" ? ` / ${product.unitLabel}` : "";
  if (product.offerPrice !== undefined) {
    return (
      <p className={className}>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-bold">
            {formatPrice(product.offerPrice, product.currency)}
            {suffix}
          </span>
          <span className="text-sm font-normal text-muted line-through">
            <span className="sr-only">Antes: </span>
            {formatPrice(product.price, product.currency)}
          </span>
        </span>
        <CupEstimate product={product} />
      </p>
    );
  }
  return (
    <p className={cn("font-bold", className)}>
      {formatPrice(product.price, product.currency)}
      {suffix}
      <CupEstimate product={product} />
    </p>
  );
}
