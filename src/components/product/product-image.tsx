import { NamedIcon } from "@/components/ui/named-icon";
import { findCategory } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/** Placeholder for products without photos: tinted tile with the category icon. */
export function ProductImage({ category, className }: { category: string; className?: string }) {
  const c = findCategory(category);
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center rounded-xl", className)}
      style={{ background: c?.tint ?? "#EFEAE0", color: c?.ink ?? "#5B625D" }}
    >
      <NamedIcon name={c?.icon ?? "Package"} className="size-1/3" strokeWidth={1.6} />
    </div>
  );
}

/** First photo of a product (the small version), or the placeholder. */
export function ProductPhoto({ product, className }: { product: Product; className?: string }) {
  const photo = product.images?.[0];
  if (!photo) return <ProductImage category={product.category} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- already resized on upload and served from /fotos
    <img src={photo.thumb} alt="" loading="lazy" decoding="async" className={cn("rounded-xl bg-sand object-cover", className)} />
  );
}
