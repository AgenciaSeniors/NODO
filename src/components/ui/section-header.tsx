import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  href?: string;
  /** Visible link text; without it the link is just a chevron. */
  linkLabel?: string;
  /** Small pill next to the title, e.g. "Patrocinados". */
  tag?: ReactNode;
};

export function SectionHeader({ title, href, linkLabel, tag }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-lg font-bold whitespace-nowrap">{title}</h2>
      {tag ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{tag}</span> : null}
      {href ? (
        <Link
          href={href}
          aria-label={linkLabel ? undefined : `Ver todo: ${title}`}
          className="-mr-2 ml-auto flex min-h-11 min-w-11 items-center justify-end gap-0.5 px-2 text-sm font-semibold text-brand-700"
        >
          {linkLabel}
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      ) : null}
    </div>
  );
}
