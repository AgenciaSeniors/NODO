import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { LocationButton } from "@/components/layout/location-button";
import { ProductCard } from "@/components/product/product-card";
import { CategoryChips } from "@/components/ui/category-chips";
import { ChipLink } from "@/components/ui/chip-link";
import { SearchBox } from "@/components/ui/search-box";
import { findCategory } from "@/lib/catalog";
import { listProducts, type ProductFilter, type ProductSort } from "@/lib/data";
import { getLocation } from "@/lib/location";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = { title: "Explorar" };

const FILTERS: Array<{ id: ProductFilter; label: string }> = [
  { id: "tiendas", label: "Tiendas" },
  { id: "ofertas", label: "Ofertas" },
  { id: "cantidad", label: "Por cantidad" },
  { id: "domicilio", label: "Domicilio" },
];
const SORTS: ProductSort[] = ["recomendados", "recientes", "cerca", "precio-asc", "precio-desc"];

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function ExplorePage({ searchParams }: PageProps<"/explorar">) {
  const params = await searchParams;
  const q = one(params.q);
  const category = findCategory(one(params.categoria))?.id;
  const sortParam = one(params.orden) as ProductSort | undefined;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "recomendados";
  const active = (one(params.filtro)?.split(",") ?? []).filter((f): f is ProductFilter =>
    FILTERS.some((x) => x.id === f),
  );

  const location = await getLocation();
  const products = await listProducts({
    provinceId: location?.province.id,
    municipalityId: location?.municipality?.id,
    q,
    category,
    only: active,
    sort,
  });

  const hrefWith = (toggle: ProductFilter) => {
    const next = active.includes(toggle) ? active.filter((f) => f !== toggle) : [...active, toggle];
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("categoria", category);
    if (next.length) sp.set("filtro", next.join(","));
    if (sort !== "recomendados") sp.set("orden", sort);
    const s = sp.toString();
    return s ? `/explorar?${s}` : "/explorar";
  };
  const keep = { filtro: active.join(",") || undefined, orden: sort !== "recomendados" ? sort : undefined };

  return (
    <>
      <AppHeader />
      <div className="space-y-4 px-4 pb-6">
        <h1 className="sr-only">Explorar productos</h1>
        <div className="space-y-3">
          <LocationButton returnTo="/explorar" />
          <SearchBox
            id="buscar-explorar"
            action="/explorar"
            placeholder="¿Qué estás buscando?"
            defaultValue={q}
            keep={{ ...keep, categoria: category }}
          />
        </div>
        <nav aria-label="Filtros" className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <ChipLink key={f.id} href={hrefWith(f.id)} active={active.includes(f.id)}>
              {f.label}
            </ChipLink>
          ))}
        </nav>
        <CategoryChips basePath="/explorar" active={category} keep={{ ...keep, q }} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {products.length === 1 ? "1 resultado" : `${products.length} resultados`}
            {location ? ` en ${location.province.name}` : ""}
          </p>
          <Suspense>
            <SortSelect value={sort} />
          </Suspense>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
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
