import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { PublishForm, type DraftInit, type SellerOption } from "@/app/(app)/publicar/publish-form";
import { canEditListing, requireViewer } from "@/lib/auth";
import { getProduct } from "@/lib/data";
import { DEMO_MODE } from "@/lib/mode";

export const metadata: Metadata = { title: "Editar publicación" };

export default async function EditListingPage({ params }: PageProps<"/perfil/publicaciones/[id]/editar">) {
  const { id } = await params;
  const user = await requireViewer(`/perfil/publicaciones/${id}/editar`);
  const product = await getProduct(id);
  // The example version treats the example private listings as the visitor's.
  const allowed = product && (canEditListing(product, user) || (DEMO_MODE && product.seller.type === "person"));
  if (!product || !allowed) notFound();

  const store = product.seller.type === "store" ? product.seller.store : undefined;
  const whatsapp = product.whatsapp ?? (product.seller.type === "person" ? product.seller.whatsapp : store?.whatsapp) ?? "";
  // The seller can't change: a listing stays with the person or store that published it.
  const seller: SellerOption = store
    ? {
        key: store.slug,
        label: store.name,
        payment: store.payment,
        delivery: store.delivery,
        provinceId: product.provinceId,
        municipalityId: product.municipalityId,
        whatsapp,
      }
    : {
        key: "me",
        label: `${user.name} (particular)`,
        provinceId: product.provinceId,
        municipalityId: product.municipalityId,
        whatsapp,
      };
  const initial: DraftInit = {
    title: product.title,
    category: product.category,
    condition: product.condition ?? "new",
    description: product.description,
    price: String(product.price),
    currency: product.currency,
    saleMode: product.saleMode,
    minQty: product.minQty ? String(product.minQty) : "",
    tiers: product.tiers.map((t) => ({ minQty: String(t.minQty), unitPrice: String(t.unitPrice) })),
    payment: product.payment,
    delivery: product.delivery,
    province: product.provinceId,
    municipality: product.municipalityId,
    whatsapp,
    photos: (product.images ?? []).flatMap((i) => (i.path ? [{ url: i.thumb, path: i.path }] : [])),
  };

  return (
    <>
      <AppHeader backHref="/perfil/publicaciones" action="none" />
      <div className="space-y-5 px-4 pb-8">
        <h1 className="text-3xl font-bold">Editar publicación</h1>
        <PublishForm
          sellers={[seller]}
          initialSeller={seller.key}
          remainingListings={user.plan.limit - user.plan.activeListings}
          planName={user.plan.name}
          initial={initial}
          editingId={product.id}
        />
      </div>
    </>
  );
}
