import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ChipLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap",
        active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink",
      )}
    >
      {children}
    </Link>
  );
}
