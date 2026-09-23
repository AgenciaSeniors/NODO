import { NamedIcon } from "@/components/ui/named-icon";
import { findCategory } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/** Placeholder until products have photos: tinted tile with the category icon. */
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
