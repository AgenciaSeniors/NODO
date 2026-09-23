import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** "outline": white chips (Tiendas). "soft": green-tinted chips (Explorar). */
export function ChipLink({
  href,
  active,
  look = "outline",
  children,
}: {
  href: string;
  active?: boolean;
  look?: "outline" | "soft";
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap",
        look === "outline" &&
          (active ? "border border-brand-500 bg-brand-50 text-brand-700" : "border border-line bg-white text-ink"),
        look === "soft" && (active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"),
      )}
    >
      {children}
    </Link>
  );
}
