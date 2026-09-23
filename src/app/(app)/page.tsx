import Link from "next/link";
import { Ellipsis, MapPin } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LocationButton } from "@/components/layout/location-button";
import { ProductCard } from "@/components/product/product-card";
import { StoreTile } from "@/components/store/store-tile";
import { EmptyArea } from "@/components/ui/empty-area";
import { NamedIcon } from "@/components/ui/named-icon";
import { SearchBox } from "@/components/ui/search-box";
import { SectionHeader } from "@/components/ui/section-header";
import { SeeMoreTile } from "@/components/ui/see-more-tile";
import { findCategory } from "@/lib/catalog";
import { listProducts, listStores } from "@/lib/data";
import { getFavoriteIds } from "@/lib/favorites-server";
import { getLocation } from "@/lib/location";

// The quick row on Inicio; "Más" opens every category.
const QUICK_CATEGORIES = ["alimentos", "tecnologia", "hogar", "ropa", "vehiculos"];
const row = "no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2";

export default async function HomePage() {
  const location = await getLocation();
  const area = { provinceId: location?.province.id, municipalityId: location?.municipality?.id };
  const [sponsored, nearby, stores, favorites] = await Promise.all([
    listProducts({ ...area, sponsored: true, limit: 6 }),
    listProducts({ ...area, sponsored: false, sort: "cerca", limit: 8 }),
    listStores(area),
    getFavoriteIds(),
  ]);
  const empty = sponsored.length + nearby.length + stores.length === 0;

  return (
    <>
      <AppHeader />
      <div className="space-y-6 px-4 pb-6">
        <div className="space-y-3">
          <LocationButton returnTo="/" look="inline" />
          <SearchBox id="buscar-inicio" action="/explorar" placeholder="¿Qué estás buscando?" className="rounded-full" />
        </div>

        <nav aria-label="Categorías" className="grid grid-cols-6 gap-x-1">
          {QUICK_CATEGORIES.map((id) => {
            const c = findCategory(id)!;
            return (
              <Link key={id} href={`/explorar?categoria=${id}`} className="flex min-w-0 flex-col items-center gap-1.5 text-center text-[11px] leading-tight font-medium">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <NamedIcon name={c.icon} className="size-7" strokeWidth={2.2} />
                </span>
                {c.label}
              </Link>
            );
          })}
          <Link href="/categorias" className="flex min-w-0 flex-col items-center gap-1.5 text-center text-[11px] leading-tight font-medium">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Ellipsis aria-hidden className="size-7" strokeWidth={2.6} />
            </span>
            Más
          </Link>
        </nav>

        {!location ? (
          <Link href="/ubicacion?volver=/" className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
            <MapPin aria-hidden className="size-6 shrink-0 text-brand-700" />
            <span className="text-sm">
              <strong className="block text-brand-700">Elige tu provincia y municipio</strong>
              Así te mostramos primero lo que se vende cerca de ti.
            </span>
          </Link>
        ) : null}

        {empty && location ? <EmptyArea place={location.province.name} /> : null}

        {sponsored.length > 0 ? (
          <section>
            <SectionHeader title="Destacados cerca de ti" tag="Patrocinados" href="/explorar" />
            <div className={row}>
              {sponsored.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" featured saved={favorites.has(p.id)} />
              ))}
              <SeeMoreTile href="/explorar" title="Ver más" subtitle="destacados" solid />
            </div>
          </section>
        ) : null}

        {nearby.length > 0 ? (
          <section>
            <SectionHeader title="Cerca de ti" href="/explorar?orden=cerca" />
            <div className={row}>
              {nearby.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact" saved={favorites.has(p.id)} className="w-36" />
              ))}
            </div>
          </section>
        ) : null}

        {stores.length > 0 ? (
          <section>
            <SectionHeader title="Tiendas cerca de ti" href="/tiendas" />
            <div className={row}>
              {stores.map((s) => (
                <StoreTile key={s.id} store={s} />
              ))}
              <SeeMoreTile href="/tiendas" title="Ver todas" subtitle="las tiendas" />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
