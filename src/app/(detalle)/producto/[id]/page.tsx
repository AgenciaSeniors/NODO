import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftRight,
  Banknote,
  ChevronRight,
  Clock,
  CreditCard,
  Flag,
  House,
  MapPin,
  Star,
  Store,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BackButton } from "@/components/layout/back-button";
import { productBadge } from "@/components/product/badge";
import { FavoriteButton } from "@/components/product/favorite-button";
import { Price } from "@/components/product/price";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { StoreAvatar } from "@/components/store/store-avatar";
import { VerifiedBadge } from "@/components/store/verified-badge";
import { SectionHeader } from "@/components/ui/section-header";
import { ShareButton } from "@/components/ui/share-button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { AVAILABILITY_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { getProduct, getSeller, listProducts } from "@/lib/data";
import { getFavoriteIds } from "@/lib/favorites-server";
import { formatDistance, formatPrice, timeAgo } from "@/lib/format";
import { findProvince } from "@/lib/geo/cuba";
import { tierRows } from "@/lib/tiers";
import { productInquiry } from "@/lib/whatsapp";

export async function generateMetadata({ params }: PageProps<"/producto/[id]">): Promise<Metadata> {
  const product = await getProduct((await params).id);
  if (!product) return {};
  const price = formatPrice(product.offerPrice ?? product.price, product.currency);
  const place = findProvince(product.provinceId)?.name;
  // Shown in the WhatsApp link preview when someone shares the product.
  return {
    title: `${product.title} · ${price}`,
    description: `${price} en ${place}. ${product.description}`,
    openGraph: { title: `${product.title} · ${price}`, description: product.description },
  };
}

function TermsCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: Array<{ icon: LucideIcon; label: string }> }) {
  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line/70">
      <h2 className="mb-2 flex items-center gap-1.5 text-[15px] font-bold">
        <Icon aria-hidden className="size-4 shrink-0 text-brand-600" />
        {title}
      </h2>
      <ul className="space-y-1.5 text-sm">
        {items.map(({ icon: ItemIcon, label }) => (
          <li key={label} className="flex items-start gap-2">
            <ItemIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProductPage({ params }: PageProps<"/producto/[id]">) {
  const product = await getProduct((await params).id);
  if (!product) notFound();
  const [seller, favorites] = await Promise.all([getSeller(product), getFavoriteIds()]);
  const saved = favorites.has(product.id);
  const rows = tierRows(product);
  const more = seller.store
    ? (await listProducts({ storeId: seller.store.id })).filter((p) => p.id !== product.id).slice(0, 6)
    : [];
  const unit = product.unitLabel === "unidad" ? "u" : product.unitLabel;
  const dot =
    product.availability === "available"
      ? "bg-brand-500"
      : product.availability === "low_stock"
        ? "bg-amber-500"
        : "bg-muted/60";

  const payment = product.payment.map((p) =>
    p === "cash" ? { icon: Banknote, label: "Efectivo" } : { icon: ArrowLeftRight, label: "Transferencia" },
  );
  const delivery = product.delivery.map((d) =>
    d === "pickup"
      ? { icon: seller.store ? Store : House, label: seller.store ? "Recogida en tienda" : "Recogida" }
      : { icon: House, label: product.deliveryNote ?? seller.store?.deliveryNote ?? "Domicilio" },
  );

  return (
    <>
      <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-2">
        <BackButton fallback="/explorar" />
        <Link href="/" className="flex h-11 items-center">
          <Logo className="h-9 w-auto" />
        </Link>
        <div className="flex justify-end">
          <ShareButton title={product.title} text={`Mira ${product.title} en NODO`} />
          <FavoriteButton productId={product.id} productTitle={product.title} initialSaved={saved} look="plain" />
        </div>
      </header>

      <article className="space-y-5 px-4">
        <ProductGallery images={product.images ?? []} category={product.category} title={product.title} badge={productBadge(product)} />

        <header className="space-y-1">
          <h1 className="text-3xl leading-tight font-bold">{product.title}</h1>
          <Price product={product} className="text-3xl text-brand-600" />
          <p className="flex items-center gap-2 pt-1">
            <span aria-hidden className={cn("size-3 rounded-full", dot)} />
            <span>
              <strong className="font-semibold text-brand-700">{AVAILABILITY_LABELS[product.availability]}</strong>
              <span className="text-muted"> · confirmado {timeAgo(product.confirmedAt)}</span>
            </span>
          </p>
          {product.condition ? (
            <p className="text-sm text-muted">Estado: {product.condition === "new" ? "Nuevo" : "Usado"}</p>
          ) : null}
          {product.saleMode === "bulk_only" && product.minQty ? (
            <p className="font-semibold text-brand-700">
              Venta mínima: {product.minQty} {product.unitLabel}s
            </p>
          ) : null}
        </header>

        {seller.store ? (
          <Link href={`/tiendas/${seller.store.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-line/70">
            <StoreAvatar logo={seller.store.logo} size={52} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="flex items-center gap-1.5 text-lg font-bold">
                <span className="truncate">{seller.store.name}</span>
                {seller.store.verified ? <VerifiedBadge /> : null}
                <ChevronRight aria-hidden className="size-5 shrink-0" />
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-muted">
                  <MapPin aria-hidden className="size-4" />
                  {formatDistance(product.distanceKm)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-medium",
                    seller.store.openNow ? "bg-brand-50 text-brand-700" : "bg-sand text-muted",
                  )}
                >
                  {seller.store.openNow ? "Abierto" : "Cerrado"}
                </span>
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-line/70">
            <span aria-hidden className="flex size-13 items-center justify-center rounded-full bg-sand text-lg font-bold text-muted">
              {seller.name.charAt(0)}
            </span>
            <div>
              <p className="text-lg font-bold">{seller.name}</p>
              <p className="flex items-center gap-1 text-sm text-muted">
                <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" />
                {seller.rating} · Particular · en NODO desde {seller.memberSince}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin aria-hidden className="size-4" />
                {formatDistance(product.distanceKm)}
              </p>
            </div>
          </div>
        )}

        {product.description ? (
          <section className="space-y-1">
            <h2 className="text-xl font-bold">Descripción</h2>
            <p className="leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
          </section>
        ) : null}

        {rows.length > 0 ? (
          <section className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-line/70">
            <h2 className="mb-1 flex items-center gap-2 font-bold">
              <Tag aria-hidden className="size-5 text-brand-600" />
              Precio por cantidad
            </h2>
            <table className="w-full">
              <thead className="sr-only">
                <tr>
                  <th>Cantidad</th>
                  <th>Precio por {product.unitLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.range}>
                    <td className="py-2">
                      {r.range} {product.unitLabel === "unidad" ? "unidades" : `${product.unitLabel}s`}
                    </td>
                    <td className="py-2 text-right font-semibold whitespace-nowrap text-brand-700">
                      {formatPrice(r.unitPrice, product.currency)}/{unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 flex items-center gap-2 rounded-xl bg-sand/70 px-3 py-2 text-sm">
              <Clock aria-hidden className="size-4 shrink-0" />
              Actualizado {timeAgo(product.confirmedAt)}
            </p>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <TermsCard icon={CreditCard} title="Formas de pago" items={payment} />
          <TermsCard icon={Truck} title="Entrega" items={delivery} />
        </div>

        {more.length > 0 && seller.store ? (
          <section>
            <SectionHeader title="Más de esta tienda" href={`/tiendas/${seller.store.slug}`} linkLabel="Ver todo" />
            <div className="no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {more.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" showBadge saved={favorites.has(p.id)} className="w-40" />
              ))}
            </div>
          </section>
        ) : null}

        <Link href="/pronto?que=reportes" className="flex min-h-11 items-center gap-2 text-sm text-muted">
          <Flag aria-hidden className="size-4" />
          Reportar publicación
        </Link>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md gap-3 border-t border-line bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <WhatsAppButton phone={seller.whatsapp} message={productInquiry(product.title)} className="h-14 flex-1 text-lg" />
        <FavoriteButton productId={product.id} productTitle={product.title} initialSaved={saved} look="outline" />
      </div>
    </>
  );
}
