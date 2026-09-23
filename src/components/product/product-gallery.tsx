"use client";

import { useState, type UIEvent } from "react";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/cn";

/** Swipeable photos (CSS scroll snap) with a "1/4" counter and dots. */
export function ProductGallery({
  images,
  category,
  title,
  badge,
}: {
  images: string[];
  category: string;
  title: string;
  badge: string | null;
}) {
  const [index, setIndex] = useState(0);
  const count = Math.max(images.length, 1);

  function onScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl">
        <div
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[16/9] snap-x snap-mandatory overflow-x-auto"
          role="group"
          aria-roledescription="galería"
          aria-label={`Fotos de ${title}`}
        >
          {images.length === 0 ? (
            <ProductImage category={category} className="size-full shrink-0 snap-center rounded-none" />
          ) : (
            images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- remote storage URLs, sized by CSS
              <img key={src} src={src} alt={`${title}, foto ${i + 1} de ${images.length}`} className="size-full shrink-0 snap-center object-cover" />
            ))
          )}
        </div>
        {badge ? (
          <span className="absolute top-3 left-3 rounded-full bg-brand-600 px-3.5 py-1 font-semibold text-white">{badge}</span>
        ) : null}
        {count > 1 ? (
          <span className="absolute top-3 right-3 rounded-lg bg-white/90 px-2 py-0.5 text-sm font-medium">
            {index + 1}/{count}
          </span>
        ) : null}
      </div>
      {count > 1 ? (
        <div aria-hidden className="flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={cn("size-2 rounded-full", i === index ? "bg-brand-600" : "bg-line")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
