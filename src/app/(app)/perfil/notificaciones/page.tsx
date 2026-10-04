import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { requireViewer } from "@/lib/auth";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import { getOwnListings, getStoreListings } from "@/lib/data";
import { formatPrice, timeAgo } from "@/lib/format";
import { isStale } from "@/lib/listing-status";
import type { Availability, Product } from "@/lib/types";
import { ListingRow, type ListingView } from "@/app/(app)/perfil/publicaciones/listing-row";

export const metadata: Metadata = { title: "Notificaciones" };

const PERSON_MOVES: Partial<Record<Availability, Array<{ to: Availability; label: string }>>> = {
  available: [{ to: "sold", label: "Marcar como vendido" }, { to: "archived", label: "Archivar (quitar de NODO)" }],
  reserved: [{ to: "available", label: "Volver a disponible" }, { to: "sold", label: "Marcar como vendido" }],
};

const STORE_MOVES: Partial<Record<Availability, Array<{ to: Availability; label: string }>>> = {
  available: [{ to: "out_of_stock", label: "Marcar agotado" }, { to: "hidden", label: "Ocultar (quitar de NODO)" }],
  low_stock: [{ to: "available", label: "Quedan suficientes" }, { to: "out_of_stock", label: "Marcar agotado" }],
  out_of_stock: [{ to: "available", label: "Ya hay de nuevo" }],
};

function toView(p: Product, now: Date): ListingView {
  const unit = p.saleMode === "bulk_only" ? ` / ${p.unitLabel}` : "";
  const isStore = p.seller.type === "store";
  return {
    id: p.id,
    title: p.title,
    price: formatPrice(p.offerPrice ?? p.price, p.currency) + unit,
    thumb: p.images?.[0]?.thumb,
    category: p.category,
    availability: p.availability,
    statusLabel: AVAILABILITY_LABELS[p.availability],
    confirmedAgo: timeAgo(p.confirmedAt, now),
    stale: true,
    confirmable: true,
    moves: (isStore ? STORE_MOVES : PERSON_MOVES)[p.availability] ?? [],
  };
}

export default async function NotificationsPage() {
  const user = await requireViewer("/perfil/notificaciones");
  const now = new Date();

  const [ownListings, storeListings] = await Promise.all([
    getOwnListings(user.id),
    Promise.all(user.stores.map((store) => getStoreListings(store.id))),
  ]);

  const staleOwn = ownListings.filter((p) => isStale(p, now));
  const staleStores = user.stores
    .map((store, i) => ({ store, products: storeListings[i].filter((p) => isStale(p, now)) }))
    .filter((group) => group.products.length > 0);

  const atLimit = user.plan.activeListings >= user.plan.limit;
  const hasNotifications = atLimit || staleOwn.length > 0 || staleStores.length > 0;

  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-5 px-4 pb-6">
        <h1 className="text-2xl font-bold">Notificaciones</h1>

        {!hasNotifications ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-line/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <Bell aria-hidden className="size-7" />
            </span>
            <p className="font-bold">Estás al día</p>
            <p className="text-sm text-muted">
              Aquí avisamos cuando algo tuyo necesite atención: publicaciones sin confirmar o el límite de tu plan.
            </p>
          </div>
        ) : (
          <>
            {atLimit ? (
              <Link
                href="/perfil/publicaciones"
                className="block rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
              >
                Llegaste a tus <strong>{user.plan.limit}</strong> publicaciones activas del {user.plan.name}. Marca
                alguna como vendida o archívala para publicar otra.
              </Link>
            ) : null}

            {staleOwn.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted">Tus publicaciones</h2>
                <ul className="space-y-3">
                  {staleOwn.map((p) => (
                    <ListingRow key={p.id} listing={toView(p, now)} />
                  ))}
                </ul>
              </section>
            ) : null}

            {staleStores.map(({ store, products }) => (
              <section key={store.id} className="space-y-3">
                <h2 className="text-sm font-semibold text-muted">{store.name}</h2>
                <ul className="space-y-3">
                  {products.map((p) => (
                    <ListingRow key={p.id} listing={toView(p, now)} />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  );
}
