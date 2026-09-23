import type { Metadata } from "next";
import { Store } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { requireViewer } from "@/lib/auth";
import { getLocation } from "@/lib/location";
import { CreateStoreForm } from "./create-store-form";

export const metadata: Metadata = { title: "Crear tienda" };

export default async function NewStorePage() {
  const [user, location] = await Promise.all([requireViewer("/perfil/tiendas/nueva"), getLocation()]);
  // Default to the area the person browses; otherwise their profile's.
  const province = location?.province.id ?? user.provinceId;
  const municipality = location ? location.municipality?.id : user.municipalityId;
  return (
    <>
      <AppHeader backHref="/perfil" action="none" />
      <div className="space-y-6 px-4 pb-8">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1">
            <h1 className="text-3xl font-bold">Crear tienda</h1>
            <p className="text-sm text-muted">Completa la información de tu tienda para que más personas te encuentren en NODO.</p>
          </div>
          <div className="flex w-36 shrink-0 items-center gap-2 rounded-2xl bg-brand-50 p-3 text-xs font-medium text-brand-700">
            <Store aria-hidden className="size-7 shrink-0" />
            Tu negocio también llega más lejos
          </div>
        </div>
        <CreateStoreForm defaultProvince={province} defaultMunicipality={municipality} />
      </div>
    </>
  );
}
