import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, LayoutGrid } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { NamedIcon } from "@/components/ui/named-icon";
import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage({ searchParams }: PageProps<"/categorias">) {
  const params = await searchParams;
  // Keep the search and filters the user already had in Explorar.
  const keep = new URLSearchParams();
  for (const key of ["q", "filtro", "orden"]) {
    const value = params[key];
    if (typeof value === "string" && value) keep.set(key, value);
  }
  const active = typeof params.categoria === "string" ? params.categoria : undefined;
  const hrefFor = (category?: string) => {
    const sp = new URLSearchParams(keep);
    if (category) sp.set("categoria", category);
    const s = sp.toString();
    return s ? `/explorar?${s}` : "/explorar";
  };

  const options = [
    { id: undefined, label: "Todas las categorías", icon: null },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  return (
    <>
      <AppHeader backHref={hrefFor(active)} action="none" />
      <div className="space-y-4 px-4 pb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-line/60">
          {options.map((o) => {
            const selected = o.id === active;
            return (
              <li key={o.label}>
                <Link
                  href={hrefFor(o.id)}
                  aria-current={selected ? "true" : undefined}
                  className="flex min-h-16 items-center gap-4 px-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    {o.icon ? <NamedIcon name={o.icon} className="size-6" /> : <LayoutGrid aria-hidden className="size-6" />}
                  </span>
                  <span className={cn("flex-1", selected && "font-bold text-brand-700")}>{o.label}</span>
                  {selected ? (
                    <Check aria-hidden className="size-5 text-brand-600" />
                  ) : (
                    <ChevronRight aria-hidden className="size-5 text-muted" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
