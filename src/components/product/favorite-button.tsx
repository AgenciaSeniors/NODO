"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { FAVORITES_COOKIE, parseFavorites, serializeFavorites, toggleFavorite } from "@/lib/favorites";

// Every heart on the page reads the same cookie, so toggling one updates the others.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readIds() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FAVORITES_COOKIE}=([^;]*)`));
  return parseFavorites(match?.[1]);
}

type FavoriteButtonProps = {
  productId: string;
  productTitle: string;
  /** Whether the server rendered it as saved (from the same cookie). */
  initialSaved: boolean;
  look?: "overlay" | "plain" | "outline";
  /** Re-render the page after a change (the Favoritos list). */
  refresh?: boolean;
  className?: string;
};

export function FavoriteButton({
  productId,
  productTitle,
  initialSaved,
  look = "overlay",
  refresh = false,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const saved = useSyncExternalStore(
    subscribe,
    () => readIds().includes(productId),
    () => initialSaved,
  );

  function toggle() {
    const ids = serializeFavorites(toggleFavorite(readIds(), productId));
    document.cookie = `${FAVORITES_COOKIE}=${ids}; path=/; max-age=31536000; samesite=lax`;
    listeners.forEach((l) => l());
    if (refresh) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={`Guardar ${productTitle} en favoritos`}
      className={cn(
        "flex shrink-0 items-center justify-center",
        look === "overlay" && "size-9 rounded-full bg-white/95 shadow-sm",
        look === "plain" && "size-11 rounded-full",
        look === "outline" && "size-14 rounded-2xl bg-white ring-1 ring-line",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(look === "outline" ? "size-6" : "size-5", saved ? "fill-danger-600 text-danger-600" : "text-ink")}
      />
    </button>
  );
}
