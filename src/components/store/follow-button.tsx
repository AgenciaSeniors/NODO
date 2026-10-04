"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { STORE_FOLLOWS_COOKIE, parseFollows, serializeFollows, toggleFollow } from "@/lib/store-follows";

// Every button on the page reads the same cookie, so toggling one updates the others.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readIds() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${STORE_FOLLOWS_COOKIE}=([^;]*)`));
  return parseFollows(match?.[1]);
}

type FollowButtonProps = {
  storeId: string;
  storeName: string;
  /** Whether the server rendered it as followed (from the same cookie). */
  initialFollowed: boolean;
  /** Re-render the page after a change (the "Tiendas que sigo" list). */
  refresh?: boolean;
  className?: string;
};

export function FollowButton({ storeId, storeName, initialFollowed, refresh = false, className }: FollowButtonProps) {
  const router = useRouter();
  const following = useSyncExternalStore(
    subscribe,
    () => readIds().includes(storeId),
    () => initialFollowed,
  );

  function toggle() {
    const ids = serializeFollows(toggleFollow(readIds(), storeId));
    document.cookie = `${STORE_FOLLOWS_COOKIE}=${ids}; path=/; max-age=31536000; samesite=lax`;
    listeners.forEach((l) => l());
    if (refresh) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={following}
      aria-label={following ? `Dejar de seguir ${storeName}` : `Seguir ${storeName}`}
      className={cn(
        "flex h-12 items-center gap-2 rounded-2xl px-5 font-semibold",
        following ? "bg-brand-100 text-brand-700" : "bg-brand-50 text-brand-700",
        className,
      )}
    >
      {following ? <UserCheck aria-hidden className="size-5" /> : <UserPlus aria-hidden className="size-5" />}
      {following ? "Siguiendo" : "Seguir"}
    </button>
  );
}
