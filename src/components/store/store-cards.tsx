import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import { OpenStatus } from "@/components/store/open-status";
import { StoreAvatar } from "@/components/store/store-avatar";
import { VerifiedBadge } from "@/components/store/verified-badge";
import { formatDistance } from "@/lib/format";
import type { Store } from "@/lib/types";

/** Full-width row used in "Tiendas cerca de ti". */
export function StoreListItem({ store }: { store: Store }) {
  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60"
    >
      <StoreAvatar logo={store.logo} size={64} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="flex items-center gap-1.5 font-bold">
          <span className="truncate">{store.name}</span>
          {store.verified ? <VerifiedBadge /> : null}
        </p>
        <p className="truncate text-sm text-muted">{store.tagline}</p>
        <p className="text-sm">
          <OpenStatus open={store.openNow} />
          <span className="text-muted"> · {formatDistance(store.distanceKm)}</span>
        </p>
        {store.delivery.includes("delivery") ? (
          <p className="flex items-center gap-1.5 text-sm">
            <Truck aria-hidden className="size-4 text-muted" />
            Domicilio
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end justify-between">
        <ChevronRight aria-hidden className="size-5 text-muted" />
        <span className="text-sm whitespace-nowrap text-muted">{store.productCount} productos</span>
      </div>
    </Link>
  );
}

/** Compact card for the horizontal "Tiendas destacadas" row. */
export function FeaturedStoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-line/60"
    >
      <StoreAvatar logo={store.logo} size={64} />
      <span className="flex items-center gap-1 text-sm leading-tight font-bold">
        {store.name}
        {store.verified ? <VerifiedBadge /> : null}
      </span>
      <span className="text-xs text-muted">{store.tagline}</span>
    </Link>
  );
}

/** Two-column card for "Nuevas en NODO". */
export function NewStoreCard({ store }: { store: Store }) {
  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line/60"
    >
      <StoreAvatar logo={store.logo} size={48} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-bold">
          <span className="truncate">{store.name}</span>
          {store.verified ? <VerifiedBadge className="size-3.5" /> : null}
        </p>
        <p className="truncate text-xs text-muted">{store.tagline}</p>
        <p className="text-xs text-muted">{store.productCount} productos</p>
      </div>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
