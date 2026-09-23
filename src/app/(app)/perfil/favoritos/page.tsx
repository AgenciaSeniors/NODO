import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ProductCard } from "@/components/product/product-card";
import { listProducts } from "@/lib/data";
import { getFavoriteIds } from "@/lib/favorites-server";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const favorites = await getFavoriteIds();
  const products = (await listProducts({ sort: "recientes" })).filter((p) => favorites.has(p.id));

  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-4 px-4 pb-6">
        <h1 className="text-2xl font-bold">Favoritos</h1>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} saved refreshOnUnsave />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-line/60">
            <span className="flex size-14 items-center justify-center rounded-full bg-danger-50 text-danger-600">
              <Heart aria-hidden className="size-7" />
            </span>
            <p className="font-bold">Aún no guardas productos</p>
            <p className="text-sm text-muted">Toca el corazón de cualquier producto para tenerlo a mano aquí.</p>
            <Link href="/explorar" className="flex h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white">
              Explorar productos
            </Link>
          </div>
        )}
        <p className="text-xs text-muted">En esta versión de prueba los favoritos se guardan solo en este teléfono.</p>
      </div>
    </>
  );
}
