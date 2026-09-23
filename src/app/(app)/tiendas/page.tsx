import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { LocationButton } from "@/components/layout/location-button";
import { FeaturedStoreCard, NewStoreCard, StoreListItem } from "@/components/store/store-cards";
import { CategoryChips } from "@/components/ui/category-chips";
import { EmptyArea } from "@/components/ui/empty-area";
import { SearchBox } from "@/components/ui/search-box";
import { SectionHeader } from "@/components/ui/section-header";
import { findCategory } from "@/lib/catalog";
import { listStores } from "@/lib/data";
import { getLocation } from "@/lib/location";

export const metadata: Metadata = { title: "Tiendas" };

export default async function StoresPage({ searchParams }: PageProps<"/tiendas">) {
  const { q, categoria } = await searchParams;
  const query = typeof q === "string" ? q : undefined;
  const category = findCategory(typeof categoria === "string" ? categoria : undefined)?.id;
  const location = await getLocation();
  const area = { provinceId: location?.province.id, municipalityId: location?.municipality?.id };
  const filtering = Boolean(query || category);

  const [featured, nearby, newest] = await Promise.all([
    listStores({ ...area, featured: true }),
    listStores({ ...area, q: query, category }),
    listStores({ ...area, isNew: true }),
  ]);

  return (
    <>
      <AppHeader />
      <div className="space-y-6 px-4 pb-6">
        <div className="space-y-3">
          <LocationButton returnTo="/tiendas" />
          <SearchBox
            id="buscar-tiendas"
            action="/tiendas"
            placeholder="Buscar tiendas..."
            defaultValue={query}
            keep={{ categoria: category }}
          />
        </div>
        <CategoryChips basePath="/tiendas" active={category} keep={{ q: query }} />

        {!filtering && featured.length > 0 ? (
          <section>
            <SectionHeader title="Tiendas destacadas" />
            <div className="no-scrollbar relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
              {featured.map((s) => (
                <FeaturedStoreCard key={s.id} store={s} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title={filtering ? `${nearby.length} tiendas encontradas` : "Tiendas cerca de ti"} />
          {nearby.length > 0 ? (
            <div className="space-y-3">
              {nearby.map((s) => (
                <StoreListItem key={s.id} store={s} />
              ))}
            </div>
          ) : filtering ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line/60">
              No encontramos tiendas con esa búsqueda.
            </p>
          ) : (
            <EmptyArea place={location?.province.name ?? "tu zona"} />
          )}
        </section>

        {!filtering && newest.length > 0 ? (
          <section>
            <SectionHeader title="Nuevas en NODO" />
            <div className="grid grid-cols-2 gap-3">
              {newest.map((s) => (
                <NewStoreCard key={s.id} store={s} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
