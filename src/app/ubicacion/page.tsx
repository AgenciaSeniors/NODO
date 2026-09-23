import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getLocation, safeReturnPath } from "@/lib/location";
import { LocationForm } from "./location-form";

export const metadata: Metadata = { title: "Tu ubicación" };

export default async function LocationPage({ searchParams }: PageProps<"/ubicacion">) {
  const { volver } = await searchParams;
  const returnTo = safeReturnPath(typeof volver === "string" ? volver : "/");
  const current = await getLocation();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream px-5 pb-10">
      <header className="flex h-16 items-center">
        {current ? (
          <Link href={returnTo} aria-label="Volver" className="-ml-2 flex size-11 items-center justify-center">
            <ChevronLeft aria-hidden className="size-6" />
          </Link>
        ) : null}
      </header>
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="space-y-5 text-center">
          <Logo variant="vertical" className="mx-auto h-28 w-auto" />
          <p className="text-sm text-muted">Todo conecta cerca de ti.</p>
        </div>
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin aria-hidden className="size-6 text-brand-600" />
            ¿Dónde compras y vendes?
          </h1>
          <p className="text-muted">
            Elige tu provincia y municipio para ver primero lo que hay cerca de ti. Puedes cambiarlo
            cuando quieras.
          </p>
        </div>
        <LocationForm
          province={current?.province.id}
          municipality={current?.municipality?.id}
          returnTo={returnTo}
        />
      </div>
    </main>
  );
}
