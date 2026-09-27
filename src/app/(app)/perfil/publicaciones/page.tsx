import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { requireViewer } from "@/lib/auth";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { getOwnListings } from "@/lib/data";
import { formatPrice, timeAgo } from "@/lib/format";
import { isStale, tabOf, type ListingTab } from "@/lib/listing-status";
import type { Availability, Product } from "@/lib/types";
import { ListingRow, type ListingView } from "./listing-row";

export const metadata: Metadata = { title: "Mis publicaciones" };

const TABS: Array<{ id: ListingTab; label: string; empty: string }> = [
  { id: "activas", label: "Activas", empty: "No tienes publicaciones activas." },
  { id: "vendidas", label: "Vendidas", empty: "Aquí aparecerá lo que marques como vendido." },
  { id: "archivadas", label: "Archivadas", empty: "Aquí aparecerá lo que archives: no se ve en NODO, pero puedes volver a publicarlo." },
];

const MOVES: Partial<Record<Availability, Array<{ to: Availability; label: string }>>> = {
  available: [
    { to: "reserved", label: "Marcar como reservado" },
    { to: "sold", label: "Marcar como vendido" },
    { to: "archived", label: "Archivar (quitar de NODO)" },
  ],
  reserved: [
    { to: "available", label: "Volver a disponible" },
    { to: "sold", label: "Marcar como vendido" },
    { to: "archived", label: "Archivar (quitar de NODO)" },
  ],
  sold: [
    { to: "available", label: "Volver a publicar" },
    { to: "archived", label: "Archivar" },
  ],
  archived: [{ to: "available", label: "Volver a publicar" }],
  draft: [{ to: "available", label: "Publicar" }],
};

function toView(p: Product, now: Date): ListingView {
  const unit = p.saleMode === "bulk_only" ? ` / ${p.unitLabel}` : "";
  return {
    id: p.id,
    title: p.title,
    price: formatPrice(p.offerPrice ?? p.price, p.currency) + unit,
    thumb: p.images?.[0]?.thumb,
    category: p.category,
    availability: p.availability,
    statusLabel: AVAILABILITY_LABELS[p.availability],
    confirmedAgo: timeAgo(p.confirmedAt, now),
    stale: isStale(p, now),
    moves: MOVES[p.availability] ?? [],
  };
}

export default async function MyListingsPage({ searchParams }: PageProps<"/perfil/publicaciones">) {
  const { ver } = await searchParams;
  const user = await requireViewer("/perfil/publicaciones");
  const listings = await getOwnListings(user.id);
  const tab = TABS.find((t) => t.id === ver) ?? TABS[0];
  const now = new Date();
  const shown = listings.filter((p) => tabOf(p) === tab.id);
  const stale = listings.filter((p) => isStale(p, now)).length;
  const { plan } = user;
  const usage = Math.min(100, Math.round((plan.activeListings / plan.limit) * 100));

  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-4 px-4 pb-8">
        <h1 className="text-2xl font-bold">Mis publicaciones</h1>

        <section className="space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
          <p className="text-sm">
            <strong>{plan.activeListings}</strong> de {plan.limit} publicaciones activas · {plan.name}
          </p>
          <div
            role="progressbar"
            aria-label="Publicaciones activas usadas"
            aria-valuenow={plan.activeListings}
            aria-valuemin={0}
            aria-valuemax={plan.limit}
            className="h-2 overflow-hidden rounded-full bg-sand"
          >
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${usage}%` }} />
          </div>
          <p className="text-xs text-muted">Lo vendido y lo archivado no cuenta.</p>
        </section>

        {stale > 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            {stale === 1
              ? "1 publicación lleva más de una semana sin confirmar."
              : `${stale} publicaciones llevan más de una semana sin confirmar.`}{" "}
            Confirma que siguen disponibles para que la gente confíe en ellas.
          </p>
        ) : null}

        <nav aria-label="Estado" className="flex gap-1 rounded-2xl bg-sand p-1">
          {TABS.map((t) => {
            const count = listings.filter((p) => tabOf(p) === t.id).length;
            return (
              <Link
                key={t.id}
                href={t.id === "activas" ? "/perfil/publicaciones" : `/perfil/publicaciones?ver=${t.id}`}
                replace
                aria-current={t.id === tab.id ? "page" : undefined}
                className={cn(
                  "flex h-11 flex-1 items-center justify-center gap-1 rounded-xl text-sm font-semibold",
                  t.id === tab.id ? "bg-white text-ink shadow-sm" : "text-muted",
                )}
              >
                {t.label}
                <span className="text-xs font-medium text-muted">({count})</span>
              </Link>
            );
          })}
        </nav>

        {shown.length > 0 ? (
          <ul className="space-y-3">
            {shown.map((p) => (
              <ListingRow key={p.id} listing={toView(p, now)} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-line/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <FileText aria-hidden className="size-7" />
            </span>
            <p className="text-sm text-muted">{listings.length === 0 ? "Aún no has publicado nada como particular." : tab.empty}</p>
          </div>
        )}

        <Link
          href="/publicar"
          className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm"
        >
          <Plus aria-hidden className="size-5" />
          Publicar producto
        </Link>
        {user.stores.length > 0 ? (
          <p className="text-center text-xs text-muted">Los productos de tus tiendas se administran desde cada tienda.</p>
        ) : null}
      </div>
    </>
  );
}
