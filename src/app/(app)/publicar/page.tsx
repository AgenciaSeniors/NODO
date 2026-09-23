import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { requireViewer } from "@/lib/auth";
import { getLocation } from "@/lib/location";
import { DEMO_MODE } from "@/lib/mode";
import { normalizePhone } from "@/lib/phone";
import { fetchLastPersonalWhatsapp } from "@/lib/supabase/queries";
import { PublishForm, type SellerOption } from "./publish-form";

export const metadata: Metadata = { title: "Publicar producto" };

export default async function PublishPage({ searchParams }: PageProps<"/publicar">) {
  const { tienda, nombre } = await searchParams;
  const returnTo = typeof tienda === "string" ? `/publicar?${new URLSearchParams({ tienda })}` : "/publicar";
  const user = await requireViewer(returnTo);
  const [location, lastWhatsapp] = await Promise.all([
    getLocation(),
    DEMO_MODE ? undefined : fetchLastPersonalWhatsapp(user.id),
  ]);

  const sellers: SellerOption[] = [
    {
      key: "me",
      label: `${user.name} (particular)`,
      provinceId: location?.province.id ?? user.provinceId ?? "",
      municipalityId: (location ? location.municipality?.id : user.municipalityId) ?? "",
      whatsapp: lastWhatsapp ? (normalizePhone(lastWhatsapp) ?? lastWhatsapp) : undefined,
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
  // Example version only: a store "created" a moment ago isn't stored, so it
  // is offered by name with the user's current area.
  if (DEMO_MODE && tienda === "nueva" && typeof nombre === "string" && nombre.trim()) {
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
