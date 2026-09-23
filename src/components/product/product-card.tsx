import Link from "next/link";
import { MapPin, Store, User } from "lucide-react";
import { productBadge } from "@/components/product/badge";
import { FavoriteButton } from "@/components/product/favorite-button";
import { Price } from "@/components/product/price";
import { ProductImage } from "@/components/product/product-image";
import { getSeller } from "@/lib/data";
import { formatDistance } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  saved: boolean;
  /** "grid": Explorar's two-column card. "compact": the narrow cards of horizontal rows. */
  variant?: "grid" | "compact";
  /** Compact cards in "Destacados" show the DESTACADO tag over the photo. */
  featured?: boolean;
  /** Compact cards can also show the regular badge (Oferta, Tienda…). */
  showBadge?: boolean;
  refreshOnUnsave?: boolean;
  className?: string;
};

// The title link stretches over the whole card (after:inset-0) so the card is
// one tap target, while the heart stays a separate button above it.
const stretchedLink =
  "after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-600";

export async function ProductCard({
  product,
  saved,
  variant = "grid",
  featured = false,
  showBadge = variant === "grid",
  refreshOnUnsave = false,
  className,
}: ProductCardProps) {
  const seller = await getSeller(product);
  const badge = showBadge ? productBadge(product) : null;
  const heart = (
    <FavoriteButton
      productId={product.id}
      productTitle={product.title}
      initialSaved={saved}
      refresh={refreshOnUnsave}
      className="relative z-10"
    />
  );

  if (variant === "compact") {
    return (
      <article
        className={cn("relative flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line/70", className)}
      >
        <div className="relative">
          <ProductImage category={product.category} className="aspect-[6/5] w-full rounded-none" />
          {badge ? (
            <span className="absolute top-2 left-2 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>
          ) : null}
          {featured ? (
            <span className="absolute bottom-2 left-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-brand-700 uppercase">
              Destacado
            </span>
          ) : null}
          {badge ? <div className="absolute top-2 right-2">{heart}</div> : null}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 px-3 pt-2 pb-1">
          <h3 className="truncate text-sm font-semibold">
            <Link href={`/producto/${product.id}`} className={stretchedLink}>
              {product.title}
            </Link>
          </h3>
          <Price product={product} className="text-[15px]" />
          <div className="mt-auto flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted">
              <MapPin aria-hidden className="size-3.5 text-brand-600" />
              {formatDistance(product.distanceKm)}
            </span>
            {badge ? null : <div className="-mr-2">{heart}</div>}
          </div>
        </div>
      </article>
    );
  }

  const SellerIcon = seller.store ? Store : User;
  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line/70", className)}>
      <div className="relative">
        <ProductImage category={product.category} className="aspect-[7/5] w-full rounded-none" />
        {badge ? (
          <span className="absolute top-2 left-2 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">{badge}</span>
        ) : null}
        <div className="absolute top-2 right-2">{heart}</div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <Link href={`/producto/${product.id}`} className={stretchedLink}>
            {product.title}
          </Link>
        </h3>
        <Price product={product} className="text-xl text-brand-600" />
        <p className="mt-auto flex items-center gap-1.5 truncate text-sm text-muted">
          <SellerIcon aria-hidden className="size-4 shrink-0" />
          <span className="truncate">{seller.name}</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {formatDistance(product.distanceKm)}
        </p>
      </div>
    </article>
  );
}
