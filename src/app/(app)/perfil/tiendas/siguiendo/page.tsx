import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { StoreListItem } from "@/components/store/store-cards";
import { getStoresByIds } from "@/lib/data";
import { getFollowedStoreIds } from "@/lib/store-follows-server";

export const metadata: Metadata = { title: "Tiendas que sigo" };

export default async function FollowedStoresPage() {
  const follows = await getFollowedStoreIds();
  // Most recently followed first.
  const stores = await getStoresByIds([...follows].reverse());

  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-4 px-4 pb-6">
        <h1 className="text-2xl font-bold">Tiendas que sigo</h1>
        {stores.length > 0 ? (
          <div className="space-y-3">
            {stores.map((s) => (
              <StoreListItem key={s.id} store={s} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-line/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Store aria-hidden className="size-7" />
            </span>
            <p className="font-bold">Aún no sigues ninguna tienda</p>
            <p className="text-sm text-muted">Toca &quot;Seguir&quot; en cualquier tienda para tenerla a mano aquí.</p>
            <Link href="/tiendas" className="flex h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white">
              Ver tiendas
            </Link>
          </div>
        )}
        <p className="text-xs text-muted">Por ahora las tiendas que sigues se guardan solo en este teléfono.</p>
      </div>
    </>
  );
}
