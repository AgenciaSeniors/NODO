import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/cn";

export function Price({ product, className }: { product: Product; className?: string }) {
  const suffix = product.saleMode === "bulk_only" ? ` / ${product.unitLabel}` : "";
  if (product.offerPrice !== undefined) {
    return (
      <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
        <span className="font-bold">
          {formatPrice(product.offerPrice, product.currency)}
          {suffix}
        </span>
        <span className="text-sm font-normal text-muted line-through">
          <span className="sr-only">Antes: </span>
          {formatPrice(product.price, product.currency)}
        </span>
      </p>
    );
  }
  return (
    <p className={cn("font-bold", className)}>
      {formatPrice(product.price, product.currency)}
      {suffix}
    </p>
  );
}
