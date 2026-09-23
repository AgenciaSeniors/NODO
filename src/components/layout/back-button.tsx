"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Goes back in history; a page opened from a shared link falls back to `fallback`. */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label="Volver"
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
      className="flex size-11 shrink-0 items-center justify-center rounded-full"
    >
      <ChevronLeft aria-hidden className="size-7" />
    </Link>
  );
}
