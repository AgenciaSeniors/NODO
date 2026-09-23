import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, CreditCard, MapPin, Truck, UserPlus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ProductCard } from "@/components/product/product-card";
import { OpenStatus } from "@/components/store/open-status";
import { StoreAvatar } from "@/components/store/store-avatar";
import { VerifiedBadge } from "@/components/store/verified-badge";
import { InfoRow } from "@/components/ui/info-row";
import { SearchBox } from "@/components/ui/search-box";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { DELIVERY_LABELS, PAYMENT_LABELS } from "@/lib/catalog";
import { getStore, listProducts } from "@/lib/data";
import { formatDistance } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";

export async function generateMetadata({ params }: PageProps<"/tiendas/[slug]">): Promise<Metadata> {
  const store = await getStore((await params).slug);
  if (!store) return {};
  const place = findProvince(store.provinceId)?.name;
  return {
    title: store.name,
    description: `${store.tagline} en ${place}. ${store.description}`,
    openGraph: { title: `${store.name} en NODO`, description: store.description },
  };
}

export default async function StorePage({ params, searchParams }: PageProps<"/tiendas/[slug]">) {
  const { slug } = await params;
  const { q } = await searchParams;
  const store = await getStore(slug);
  if (!store) notFound();
  const query = typeof q === "string" ? q : undefined;
  const products = await listProducts({ storeId: store.id, q: query });
  const place = [findMunicipality(store.provinceId, store.municipalityId)?.name, findProvince(store.provinceId)?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <AppHeader backHref="/tiendas" />
      <div className="space-y-5 px-4 pb-6">
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line/60">
          <div className="flex items-center gap-4">
            <StoreAvatar logo={store.logo} size={72} />
            <div className="min-w-0 space-y-0.5">
              <h1 className="flex items-center gap-1.5 text-xl font-bold">
                {store.name}
                {store.verified ? <VerifiedBadge className="size-5" /> : null}
              </h1>
              <p className="text-sm text-muted">{store.tagline}</p>
              <p className="text-sm">
                <OpenStatus open={store.openNow} />
                <span className="text-muted"> · {formatDistance(store.distanceKm)}</span>
              </p>
            </div>
          </div>
          <p className="text-sm">{store.description}</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <WhatsAppButton
              phone={store.whatsapp}
              message={`Hola, vi tu tienda ${store.name} en NODO.`}
              label="WhatsApp"
            />
            <Link
              href="/pronto?que=seguir-tiendas"
              className="flex h-12 items-center gap-2 rounded-2xl bg-brand-50 px-5 font-semibold text-brand-700"
            >
              <UserPlus aria-hidden className="size-5" />
              Seguir
            </Link>
          </div>
          <div className="divide-y divide-line">
            <InfoRow icon={MapPin} label="Ubicación">
              {store.address} · {place}
            </InfoRow>
            <InfoRow icon={Clock} label="Horario">
              {store.hours}
            </InfoRow>
            <InfoRow icon={CreditCard} label="Pago">
              {store.payment.map((p) => PAYMENT_LABELS[p]).join(" · ")}
            </InfoRow>
            <InfoRow icon={Truck} label="Entrega">
              {store.delivery.map((d) => DELIVERY_LABELS[d]).join(" · ")}
              {store.deliveryNote ? <span className="block">{store.deliveryNote}</span> : null}
            </InfoRow>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Catálogo</h2>
          <SearchBox
            id="buscar-catalogo"
            action={`/tiendas/${store.slug}`}
            placeholder={`Buscar en ${store.name}`}
            defaultValue={query}
          />
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line/60">
              {query ? "Ningún producto coincide con la búsqueda." : "Esta tienda aún no tiene productos publicados."}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
