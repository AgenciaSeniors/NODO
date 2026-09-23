import Link from "next/link";
import { StoreStatus } from "@/components/store/open-status";
import { StoreAvatar } from "@/components/store/store-avatar";
import { ExampleTag } from "@/components/ui/example-tag";
import type { Store } from "@/lib/types";

/** Card of the "Tiendas cerca de ti" row on Inicio. */
export function StoreTile({ store }: { store: Store }) {
  return (
    <Link
      href={`/tiendas/${store.slug}`}
      className="relative flex w-40 shrink-0 flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line/70"
    >
      {store.example ? <ExampleTag className="absolute top-2 right-2" /> : null}
      <StoreAvatar logo={store.logo} size={52} className="mx-auto mb-1" />
      <span className="truncate font-bold">{store.name}</span>
      <span className="truncate text-sm text-muted">{store.tagline}</span>
      <span className="text-sm">
        <StoreStatus store={store} />
      </span>
    </Link>
  );
}
