"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Ellipsis, Pencil } from "lucide-react";
import { ProductImage } from "@/components/product/product-image";
import { cn } from "@/lib/cn";
import type { Availability } from "@/lib/types";
import { confirmListing, deleteListing, setListingStatus, type ListingResult } from "./actions";

export type ListingView = {
  id: string;
  title: string;
  price: string;
  thumb?: string;
  category: string;
  availability: Availability;
  statusLabel: string;
  confirmedAgo: string;
  stale: boolean;
  /** Status changes offered in the "Más" menu. */
  moves: Array<{ to: Availability; label: string }>;
};

const small = "flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold disabled:opacity-60";

export function ListingRow({ listing }: { listing: ListingView }) {
  const [pending, start] = useTransition();
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [result, setResult] = useState<ListingResult>({});
  const active = listing.availability === "available" || listing.availability === "reserved";

  function run(action: () => Promise<ListingResult>) {
    setResult({});
    start(async () => {
      const outcome = await action().catch(() => ({ error: "No pudimos guardar el cambio. Revisa tu conexión." }));
      setResult(outcome);
      if (!outcome.error) {
        setMenu(false);
        setConfirmDelete(false);
      }
    });
  }

  return (
    <li className={cn("space-y-3 rounded-2xl bg-white p-3 shadow-sm ring-1", listing.stale ? "ring-amber-400" : "ring-line/60")}>
      <div className="flex gap-3">
        {listing.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- already resized on upload and served from /fotos
          <img src={listing.thumb} alt="" loading="lazy" className="size-18 shrink-0 rounded-xl bg-sand object-cover" />
        ) : (
          <ProductImage category={listing.category} className="size-18 shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <Link href={`/producto/${listing.id}`} className="line-clamp-2 leading-snug font-semibold">
            {listing.title}
          </Link>
          <p className="font-bold text-brand-700">{listing.price}</p>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{listing.statusLabel}</span> · confirmado {listing.confirmedAgo}
          </p>
        </div>
      </div>

      {listing.stale ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Hace más de una semana que no lo confirmas. ¿Sigue disponible?
        </p>
      ) : null}

      <div className="flex gap-2">
        {active ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => confirmListing(listing.id))}
            className={cn(small, "flex-1 justify-center bg-brand-600 text-white")}
          >
            <CircleCheck aria-hidden className="size-4" />
            Sigue disponible
          </button>
        ) : null}
        <Link
          href={`/perfil/publicaciones/${listing.id}/editar`}
          className={cn(small, "bg-sand text-ink", !active && "flex-1 justify-center")}
        >
          <Pencil aria-hidden className="size-4" />
          Editar
        </Link>
        <button
          type="button"
          aria-label="Más opciones"
          aria-expanded={menu}
          aria-controls={`menu-${listing.id}`}
          onClick={() => {
            setMenu(!menu);
            setConfirmDelete(false);
          }}
          className={cn(small, "w-11 justify-center bg-sand px-0 text-ink")}
        >
          <Ellipsis aria-hidden className="size-5" />
        </button>
      </div>

      {menu ? (
        <div id={`menu-${listing.id}`} className="grid gap-2 border-t border-line pt-3">
          {listing.moves.map((move) => (
            <button
              key={move.to}
              type="button"
              disabled={pending}
              onClick={() => run(() => setListingStatus(listing.id, move.to))}
              className="flex h-11 items-center rounded-xl px-3 text-left font-medium ring-1 ring-line disabled:opacity-60"
            >
              {move.label}
            </button>
          ))}
          {confirmDelete ? (
            <div className="space-y-2 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">
              <p className="font-semibold">¿Borrar esta publicación para siempre? Se borran también sus fotos.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteListing(listing.id))}
                  className={cn(small, "bg-danger-600 text-white")}
                >
                  Sí, borrar
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={cn(small, "bg-white text-ink")}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-11 items-center rounded-xl px-3 text-left font-medium text-danger-600 ring-1 ring-danger-600/30"
            >
              Borrar
            </button>
          )}
        </div>
      ) : null}

      {pending ? (
        <p role="status" className="text-sm text-muted">
          Guardando…
        </p>
      ) : result.error ? (
        <p role="alert" className="text-sm font-medium text-danger-600">
          {result.error}
        </p>
      ) : result.notice ? (
        <p role="status" className="text-sm text-muted">
          {result.notice}
        </p>
      ) : null}
    </li>
  );
}
