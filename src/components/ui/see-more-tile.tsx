import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Last card of a horizontal row, leading to the full list. */
export function SeeMoreTile({
  href,
  title,
  subtitle,
  solid = false,
  className,
}: {
  href: string;
  title: string;
  subtitle: string;
  solid?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-brand-50 p-3 text-center ring-1 ring-brand-100",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          solid ? "bg-brand-600 text-white" : "bg-white text-brand-600 ring-1 ring-brand-100",
        )}
      >
        <ArrowRight aria-hidden className="size-6" />
      </span>
      <span className="leading-tight">
        <span className={cn("block font-bold", !solid && "text-brand-700")}>{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
    </Link>
  );
}
