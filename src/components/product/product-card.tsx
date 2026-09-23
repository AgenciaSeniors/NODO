import Link from "next/link";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { getSeller } from "@/lib/data";
import { formatDistance } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

function Tag({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "brand" | "offer" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "brand" && "bg-brand-50 text-brand-700",
        tone === "offer" && "bg-danger-50 text-danger-600",
        tone === "neutral" && "bg-sand text-ink",
      )}
    >
      {children}
    </span>
  );
}

export async function ProductCard({ product, className }: { product: Product; className?: string }) {
  const seller = await getSeller(product);
  return (
    <Link
      href={`/producto/${product.id}`}
      className={cn("flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-line/60", className)}
    >
      <div className="relative">
        <ProductImage category={product.category} className="aspect-square w-full" />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.sponsored ? <Tag tone="brand">Destacado</Tag> : null}
          {product.offerPrice !== undefined ? <Tag tone="offer">Oferta</Tag> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1 pb-1">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{product.title}</h3>
        <Price product={product} />
        <div className="flex flex-wrap gap-1">
          {product.saleMode !== "unit" ? <Tag>Por cantidad</Tag> : null}
          {product.delivery.includes("delivery") ? <Tag>Domicilio</Tag> : null}
        </div>
        <p className="mt-auto truncate text-xs text-muted">
          {formatDistance(product.distanceKm)} · {seller.name}
        </p>
      </div>
    </Link>
  );
}
