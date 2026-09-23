import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className = "size-4" }: { className?: string }) {
  return (
    <>
      <BadgeCheck aria-hidden className={`${className} shrink-0 fill-brand-500 text-white`} />
      <span className="sr-only">Tienda verificada</span>
    </>
  );
}
