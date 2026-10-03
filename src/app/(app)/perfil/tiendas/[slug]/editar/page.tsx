import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { StoreForm, type StoreFormInit } from "@/components/store/store-form";
import { requireViewer } from "@/lib/auth";

export async function generateMetadata({ params }: PageProps<"/perfil/tiendas/[slug]/editar">): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Editar · ${slug}` };
}

export default async function EditStorePage({ params }: PageProps<"/perfil/tiendas/[slug]/editar">) {
  const { slug } = await params;
  const user = await requireViewer(`/perfil/tiendas/${slug}/editar`);
  const store = user.stores.find((s) => s.slug === slug);
  if (!store) notFound();

  const initial: StoreFormInit = {
    name: store.name,
    category: store.category,
    description: store.description,
    address: store.address,
    whatsapp: store.whatsapp,
    hours: store.hours,
    payment: store.payment,
    delivery: store.delivery,
    logo: store.logo.kind === "image" ? store.logo.value : undefined,
  };

  return (
    <>
      <AppHeader backHref={`/perfil/tiendas/${slug}/administrar`} action="none" />
      <div className="space-y-6 px-4 pb-8">
        <h1 className="text-3xl font-bold">Editar tienda</h1>
        <StoreForm
          defaultProvince={store.provinceId}
          defaultMunicipality={store.municipalityId}
          initial={initial}
          editingId={store.id}
        />
      </div>
    </>
  );
}
