import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CreditCard, Flag, Phone, Star, Truck } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Price } from "@/components/product/price";
import { ProductCard } from "@/components/product/product-card";
import { ProductImage } from "@/components/product/product-image";
import { OpenStatus } from "@/components/store/open-status";
import { StoreAvatar } from "@/components/store/store-avatar";
import { VerifiedBadge } from "@/components/store/verified-badge";
import { InfoRow } from "@/components/ui/info-row";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { AVAILABILITY_LABELS, DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { getProduct, getSeller, listProducts } from "@/lib/data";
import { formatDistance, formatPrice, timeAgo } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";
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

export default async function ProductPage({ params }: PageProps<"/producto/[id]">) {
  const product = await getProduct((await params).id);
  if (!product) notFound();
  const seller = await getSeller(product);
  const rows = tierRows(product);
  const more = seller.store
    ? (await listProducts({ storeId: seller.store.id })).filter((p) => p.id !== product.id).slice(0, 4)
    : [];
  const place = [findMunicipality(product.provinceId, product.municipalityId)?.name, findProvince(product.provinceId)?.name]
    .filter(Boolean)
    .join(", ");
  const dot =
    product.availability === "available"
      ? "bg-brand-500"
      : product.availability === "low_stock"
        ? "bg-amber-500"
        : "bg-muted/60";

  return (
    <>
      <AppHeader backHref="/explorar" />
      <article className="space-y-5 px-4 pb-4">
        <ProductImage category={product.category} className="aspect-[4/3] w-full rounded-2xl" />

        <header className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {product.sponsored ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Destacado</span>
            ) : null}
            {product.condition ? (
              <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold">
                {product.condition === "new" ? "Nuevo" : "Usado"}
              </span>
            ) : null}
          </div>
          <h1 className="text-2xl leading-tight font-bold">{product.title}</h1>
          <Price product={product} className="text-2xl" />
          <p className="flex items-center gap-2 text-sm">
            <span aria-hidden className={cn("size-2 rounded-full", dot)} />
            <span>
              <strong className="font-semibold">{AVAILABILITY_LABELS[product.availability]}</strong>
              <span className="text-muted"> · confirmado {timeAgo(product.confirmedAt)}</span>
            </span>
          </p>
          {product.saleMode === "bulk_only" && product.minQty ? (
            <p className="text-sm font-semibold text-brand-700">
              Venta mínima: {product.minQty} {product.unitLabel}s
            </p>
          ) : null}
        </header>

        {rows.length > 0 ? (
          <section className="rounded-2xl bg-white p-4 ring-1 ring-line/60">
            <h2 className="mb-2 font-bold">Precio por cantidad</h2>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Cantidad</th>
                  <th>Precio por {product.unitLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.range}>
                    <td className="py-2 text-muted">
                      {r.range} {product.unitLabel === "unidad" ? "unidades" : `${product.unitLabel}s`}
                    </td>
                    <td className="py-2 text-right font-semibold">
                      {formatPrice(r.unitPrice, product.currency)} / {product.unitLabel === "unidad" ? "u" : product.unitLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section aria-label="Vendedor">
          {seller.store ? (
            <Link
              href={`/tiendas/${seller.store.slug}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line/60"
            >
              <StoreAvatar logo={seller.store.logo} size={52} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-bold">
                  {seller.store.name}
                  {seller.store.verified ? <VerifiedBadge /> : null}
                </p>
                <p className="text-sm">
                  <OpenStatus open={seller.store.openNow} />
                  <span className="text-muted"> · {formatDistance(product.distanceKm)}</span>
                </p>
              </div>
              <ChevronRight aria-hidden className="size-5 text-muted" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line/60">
              <span
                aria-hidden
                className="flex size-13 items-center justify-center rounded-full bg-sand text-lg font-bold text-muted"
              >
                {seller.name.charAt(0)}
              </span>
              <div>
                <p className="font-bold">{seller.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" />
                  {seller.rating} · Particular · en NODO desde {seller.memberSince}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-1">
          <h2 className="font-bold">Descripción</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
        </section>

        <section className="divide-y divide-line rounded-2xl bg-white px-4 ring-1 ring-line/60">
          <InfoRow icon={CreditCard} label="Pago">
            {product.payment.map((p) => PAYMENT_LABELS[p]).join(" · ")}
          </InfoRow>
          <InfoRow icon={Truck} label="Entrega">
            {product.delivery.map((d) => DELIVERY_LABELS[d]).join(" · ")} · {place}
            {product.deliveryNote ? <span className="block">{product.deliveryNote}</span> : null}
          </InfoRow>
        </section>

        {more.length > 0 ? (
          <section>
            <h2 className="mb-3 font-bold">Más de {seller.name}</h2>
            <div className="grid grid-cols-2 gap-3">
              {more.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        <Link href="/pronto?que=reportes" className="flex min-h-11 items-center gap-2 text-sm text-muted">
          <Flag aria-hidden className="size-4" />
          Reportar publicación
        </Link>

        <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 -mx-4 flex gap-2 bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pt-4 pb-2">
          <WhatsAppButton phone={seller.whatsapp} message={productInquiry(product.title)} className="flex-1" />
          <a
            href={`tel:${seller.whatsapp.replace(/\s/g, "")}`}
            aria-label={`Llamar a ${seller.name}`}
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-ink shadow-sm ring-1 ring-line"
          >
            <Phone aria-hidden className="size-5" />
          </a>
        </div>
      </article>
    </>
  );
}
