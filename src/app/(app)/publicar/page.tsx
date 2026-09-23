import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { getCurrentUser } from "@/lib/data";
import { getLocation } from "@/lib/location";
import { PublishForm, type SellerOption } from "./publish-form";

export const metadata: Metadata = { title: "Publicar producto" };

export default async function PublishPage({ searchParams }: PageProps<"/publicar">) {
  const { tienda, nombre } = await searchParams;
  const [user, location] = await Promise.all([getCurrentUser(), getLocation()]);

  const sellers: SellerOption[] = [
    {
      key: "me",
      label: `${user.name} (particular)`,
      provinceId: location?.province.id ?? "",
      municipalityId: location?.municipality?.id ?? "",
    },
    ...user.stores.map((s) => ({
      key: s.slug,
      label: s.name,
      payment: s.payment,
      delivery: s.delivery,
      provinceId: s.provinceId,
      municipalityId: s.municipalityId,
      whatsapp: s.whatsapp,
    })),
  ];
  // Coming from "¡Tu tienda ya está en NODO!": the new store isn't saved yet,
  // so it is offered by name with the user's current area.
  if (tienda === "nueva" && typeof nombre === "string" && nombre.trim()) {
    sellers.push({
      key: "nueva",
      label: nombre.trim().slice(0, 60),
      provinceId: location?.province.id ?? "",
      municipalityId: location?.municipality?.id ?? "",
    });
  }
  const initialSeller = sellers.some((s) => s.key === tienda) ? String(tienda) : "me";

  return (
    <>
      <AppHeader />
      <div className="space-y-5 px-4 pb-8">
        <h1 className="text-3xl font-bold">Publicar producto</h1>
        <PublishForm
          sellers={sellers}
          initialSeller={initialSeller}
          remainingListings={user.plan.limit - user.plan.activeListings}
          planName={user.plan.name}
        />
      </div>
    </>
  );
}
