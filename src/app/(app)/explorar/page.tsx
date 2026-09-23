import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutGrid, Package, Store, Tag, Truck, type LucideIcon } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { LocationButton } from "@/components/layout/location-button";
import { ProductCard } from "@/components/product/product-card";
import { ChipLink } from "@/components/ui/chip-link";
import { SearchBox } from "@/components/ui/search-box";
import { findCategory } from "@/lib/catalog";
import { listProducts, type ProductFilter, type ProductSort } from "@/lib/data";
import { getFavoriteIds } from "@/lib/favorites-server";
import { getLocation } from "@/lib/location";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Explorar" };

const FILTERS: Array<{ id: ProductFilter; label: string; icon: LucideIcon }> = [
  { id: "tiendas", label: "Tiendas", icon: Store },
  { id: "ofertas", label: "Ofertas", icon: Tag },
  { id: "cantidad", label: "Por cantidad", icon: Package },
  { id: "domicilio", label: "Domicilio", icon: Truck },
];
const SORTS: ProductSort[] = ["recomendados", "recientes", "cerca", "precio-asc", "precio-desc"];

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const params = await searchParams;
  const q = one(params.q);
  const category = findCategory(one(params.categoria));
  const sortParam = one(params.orden) as ProductSort | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "recomendados";
  const active = (one(params.filtro)?.split(",") ?? []).filter((f): f is ProductFilter =>
    FILTERS.some((x) => x.id === f),
  );

  const [location, favorites] = await Promise.all([getLocation(), getFavoriteIds()]);
  const products = await listProducts({
    provinceId: location?.province.id,
    municipalityId: location?.municipality?.id,
    q,
    category: category?.id,
    only: active,
    sort,
  });

  const query = (changes: { filtro?: ProductFilter[] } = {}) => {
    const filtro = changes.filtro ?? active;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("categoria", category.id);
    if (filtro.length) sp.set("filtro", filtro.join(","));
    if (sort !== "recomendados") sp.set("orden", sort);
    return sp.toString();
  };
  const toggle = (id: ProductFilter) => {
    const s = query({ filtro: active.includes(id) ? active.filter((f) => f !== id) : [...active, id] });
    return s ? `/explorar?${s}` : "/explorar";
  };
  const current = query();

  return (
    <>
      <AppHeader />
      <div className="space-y-4 px-4 pb-6">
        <h1 className="sr-only">Explorar productos</h1>
        <div className="space-y-3">
          <LocationButton returnTo="/explorar" look="inline" />
          <SearchBox
            id="buscar-explorar"
            action="/explorar"
            placeholder="Buscar productos, tiendas..."
            defaultValue={q}
            keep={{ categoria: category?.id, filtro: active.join(",") || undefined, orden: sort !== "recomendados" ? sort : undefined }}
          />
        </div>

        <nav aria-label="Filtros" className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4">
          <ChipLink look="soft" href={`/categorias${current ? `?${current}` : ""}`} active={Boolean(category)}>
            <LayoutGrid aria-hidden className="size-5" />
            {category ? category.label : "Categoría"}
          </ChipLink>
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <ChipLink key={id} look="soft" href={toggle(id)} active={active.includes(id)}>
              <Icon aria-hidden className="size-5" />
              {label}
            </ChipLink>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg" aria-live="polite">
            {products.length === 1 ? "1 resultado" : `${products.length} resultados`}
          </p>
          <Suspense>
            <SortSelect value={sort} />
          </Suspense>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} saved={favorites.has(p.id)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted ring-1 ring-line/60">
            No encontramos productos con esos filtros. Prueba con otra búsqueda o quita algún filtro.
          </p>
        )}
      </div>
    </>
  );
}
