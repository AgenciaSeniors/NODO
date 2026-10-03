import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes, CircleCheck, MapPin, Pencil, Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { StoreAvatar } from "@/components/store/store-avatar";
import { requireViewer } from "@/lib/auth";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { getStoreListings } from "@/lib/data";
import { formatPrice, timeAgo } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";
import { isStale, storeTabOf, type StoreListingTab } from "@/lib/listing-status";
import type { Availability, Product } from "@/lib/types";
import { ListingRow, type ListingView } from "@/app/(app)/perfil/publicaciones/listing-row";

export async function generateMetadata({ params }: PageProps<"/perfil/tiendas/[slug]/administrar">): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Administrar · ${slug}` };
}

const TABS: Array<{ id: StoreListingTab; label: string; empty: string }> = [
  { id: "en-venta", label: "En venta", empty: "No tienes productos en venta." },
  { id: "agotados", label: "Agotados", empty: "Aquí aparecerá lo que marques como agotado." },
  { id: "ocultos", label: "Ocultos", empty: "Aquí aparecerá lo que ocultes: no se ve en NODO, pero puedes volver a mostrarlo." },
];

/** A store manages stock, not individual sales. */
const MOVES: Partial<Record<Availability, Array<{ to: Availability; label: string }>>> = {
  available: [
    { to: "low_stock", label: "Marcar pocas unidades" },
    { to: "out_of_stock", label: "Marcar agotado" },
    { to: "hidden", label: "Ocultar (quitar de NODO)" },
  ],
  low_stock: [
    { to: "available", label: "Quedan suficientes" },
    { to: "out_of_stock", label: "Marcar agotado" },
    { to: "hidden", label: "Ocultar (quitar de NODO)" },
  ],
  out_of_stock: [
    { to: "available", label: "Ya hay de nuevo" },
    { to: "hidden", label: "Ocultar (quitar de NODO)" },
  ],
  hidden: [{ to: "available", label: "Volver a mostrar" }],
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
    confirmable: p.availability !== "hidden",
    moves: MOVES[p.availability] ?? [],
  };
}

export default async function AdministerStorePage({
  params,
  searchParams,
}: PageProps<"/perfil/tiendas/[slug]/administrar">) {
  const { slug } = await params;
  const { ver, editado } = await searchParams;
  const user = await requireViewer(`/perfil/tiendas/${slug}/administrar`);
  const store = user.stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const products = await getStoreListings(store.id);
  const tab = TABS.find((t) => t.id === ver) ?? TABS[0];
  const now = new Date();
  const shown = products.filter((p) => storeTabOf(p) === tab.id);
  const stale = products.filter((p) => isStale(p, now)).length;
  const province = findProvince(store.provinceId);
  const municipality = findMunicipality(province?.id, store.municipalityId);

  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-4 px-4 pb-8">
        {editado ? (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 font-semibold text-brand-700">
            <CircleCheck aria-hidden className="size-5 shrink-0" />
            Cambios guardados.
          </p>
        ) : null}

        <section className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
          <StoreAvatar logo={store.logo} size={60} />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="truncate text-xl font-bold">{store.name}</h1>
            <p className="text-sm text-muted">{store.tagline}</p>
            {province ? (
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin aria-hidden className="size-4" />
                {[province.name, municipality?.name].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <Link
            href={`/perfil/tiendas/${slug}/editar`}
            aria-label="Editar datos de la tienda"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink"
          >
            <Pencil aria-hidden className="size-4" />
          </Link>
        </section>

        <section className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-line/60">
          <Boxes aria-hidden className="size-5 shrink-0 text-brand-600" />
          <p>
            <strong>{products.length}</strong> {products.length === 1 ? "producto" : "productos"} en tu catálogo
          </p>
          <Link href={`/tiendas/${slug}`} className="ml-auto shrink-0 text-sm font-semibold text-brand-700">
            Ver tienda
          </Link>
        </section>

        {stale > 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            {stale === 1
              ? "1 producto lleva más de una semana sin confirmar."
              : `${stale} productos llevan más de una semana sin confirmar.`}{" "}
            Confirma que siguen disponibles para que la gente confíe en tu catálogo.
          </p>
        ) : null}

        <nav aria-label="Estado" className="flex gap-1 rounded-2xl bg-sand p-1">
          {TABS.map((t) => {
            const count = products.filter((p) => storeTabOf(p) === t.id).length;
            return (
              <Link
                key={t.id}
                href={t.id === "en-venta" ? `/perfil/tiendas/${slug}/administrar` : `/perfil/tiendas/${slug}/administrar?ver=${t.id}`}
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
              <Boxes aria-hidden className="size-7" />
            </span>
            <p className="text-sm text-muted">{products.length === 0 ? "Aún no has publicado nada en esta tienda." : tab.empty}</p>
          </div>
        )}

        <Link
          href={`/publicar?${new URLSearchParams({ tienda: slug })}`}
          className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm"
        >
          <Plus aria-hidden className="size-5" />
          Publicar producto
        </Link>
      </div>
    </>
  );
}
