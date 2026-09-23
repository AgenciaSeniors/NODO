import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHeader({ title, href, linkLabel = "Ver todas" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {href ? (
        <Link href={href} className="flex min-h-11 items-center gap-0.5 text-sm font-semibold text-brand-700">
          {linkLabel}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
