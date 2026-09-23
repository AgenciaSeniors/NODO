import Link from "next/link";
import { MapPin } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LocationButton } from "@/components/layout/location-button";
import { ProductCard } from "@/components/product/product-card";
import { FeaturedStoreCard } from "@/components/store/store-cards";
import { CategoryChips } from "@/components/ui/category-chips";
import { EmptyArea } from "@/components/ui/empty-area";
import { SearchBox } from "@/components/ui/search-box";
import { SectionHeader } from "@/components/ui/section-header";
import { listProducts, listStores } from "@/lib/data";
import { getLocation } from "@/lib/location";

export default async function HomePage() {
  const location = await getLocation();
  const area = { provinceId: location?.province.id, municipalityId: location?.municipality?.id };
  const [sponsored, nearby, stores] = await Promise.all([
    listProducts({ ...area, sponsored: true, limit: 6 }),
    listProducts({ ...area, sponsored: false, sort: "cerca", limit: 8 }),
    listStores(area),
  ]);
  const empty = sponsored.length + nearby.length + stores.length === 0;

  return (
    <>
      <AppHeader />
      <div className="space-y-6 px-4 pb-6">
        <div className="space-y-3">
          <LocationButton returnTo="/" />
          <SearchBox id="buscar-inicio" action="/explorar" placeholder="¿Qué estás buscando?" />
        </div>
        <CategoryChips basePath="/explorar" />

        {!location ? (
          <Link
            href="/ubicacion?volver=/"
            className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100"
          >
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
            <SectionHeader title="Destacados cerca de ti" href="/explorar" linkLabel="Ver más" />
            <div className="no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {sponsored.map((p) => (
                <ProductCard key={p.id} product={p} className="w-40 shrink-0" />
              ))}
            </div>
          </section>
        ) : null}

        {nearby.length > 0 ? (
          <section>
            <SectionHeader title="Cerca de ti" href="/explorar?orden=cerca" linkLabel="Ver más" />
            <div className="grid grid-cols-2 gap-3">
              {nearby.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}

        {stores.length > 0 ? (
          <section>
            <SectionHeader title="Tiendas cerca de ti" href="/tiendas" />
            <div className="no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {stores.map((s) => (
                <FeaturedStoreCard key={s.id} store={s} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
