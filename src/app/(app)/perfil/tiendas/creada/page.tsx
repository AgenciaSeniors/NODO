import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Box, Boxes, Check, ChevronRight, Clock, Info, MapPin, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { StoreAvatar } from "@/components/store/store-avatar";
import { requireViewer } from "@/lib/auth";
import { findCategory } from "@/lib/catalog";
import { initials } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";
import { DEMO_MODE } from "@/lib/mode";
import { normalizePhone } from "@/lib/phone";
import type { StoreLogo } from "@/lib/types";

export const metadata: Metadata = { title: "Tienda creada" };

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function StoreCreatedPage({ searchParams }: PageProps<"/perfil/tiendas/creada">) {
  const params = await searchParams;
  const slug = one(params.tienda);
  const user = await requireViewer(`/perfil/tiendas/creada?${new URLSearchParams({ tienda: slug })}`);
  const store = user.stores.find((s) => s.slug === slug);
  // The example version stores nothing, so it shows what was typed instead.
  if (!store && !DEMO_MODE) redirect(slug ? `/tiendas/${slug}` : "/perfil");

  const name = store?.name ?? (one(params.nombre).slice(0, 60) || "Tu tienda");
  const category = findCategory(store?.category ?? one(params.categoria));
  const province = findProvince(store?.provinceId ?? one(params.provincia));
  const municipality = findMunicipality(province?.id, store?.municipalityId ?? one(params.municipio));
  const whatsapp = store?.whatsapp ?? normalizePhone(one(params.whatsapp));
  const logo: StoreLogo = store?.logo ?? {
    kind: "initials",
    value: initials(name),
    background: category?.tint ?? "#FEF3C7",
    foreground: category?.ink ?? "#B45309",
  };
  const firstProduct = store
    ? `/publicar?${new URLSearchParams({ tienda: store.slug })}`
    : `/publicar?${new URLSearchParams({ tienda: "nueva", nombre: name })}`;

  const actions = [
    { href: firstProduct, icon: Box, label: "Agregar mi primer producto", primary: true },
    { href: "/pronto?que=carga-masiva", icon: Boxes, label: "Cargar varios productos" },
    { href: "/perfil", icon: Clock, label: "Lo haré después" },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo variant="vertical" className="h-28 w-auto" />
        <p className="text-sm">Todo conecta cerca de ti.</p>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-brand-100">
          <Check aria-hidden className="size-12 text-brand-600" strokeWidth={3} />
        </span>
        <h1 className="text-3xl leading-tight font-bold">¡Tu tienda ya está en NODO!</h1>
        <p className="text-muted">Ahora agrega productos para que más personas puedan encontrarte.</p>
      </div>

      <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
        <StoreAvatar logo={logo} size={80} />
        <div className="min-w-0 flex-1 space-y-1 text-sm">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-lg font-bold">{name}</h2>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <span aria-hidden className="size-2 rounded-full bg-brand-500" />
              Activa
            </span>
          </div>
          {category ? <p className="text-muted">{category.label}</p> : null}
          {province ? (
            <p className="flex items-center gap-1.5 text-muted">
              <MapPin aria-hidden className="size-4" />
              {[province.name, municipality?.name].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {whatsapp ? (
            <p className="flex items-center gap-1.5 text-muted">
              <MessageCircle aria-hidden className="size-4 text-brand-600" />
              {whatsapp}
            </p>
          ) : null}
        </div>
      </section>

      <nav aria-label="Siguiente paso" className="space-y-3">
        {actions.map(({ href, icon: Icon, label, primary }) => (
          <Link
            key={label}
            href={href}
            className={
              primary
                ? "flex h-15 items-center gap-4 rounded-2xl bg-brand-600 px-5 text-lg font-semibold text-white shadow-sm"
                : "flex h-15 items-center gap-4 rounded-2xl bg-white px-5 text-lg font-semibold ring-1 ring-line"
            }
          >
            <Icon aria-hidden className="size-6" />
            <span className="flex-1">{label}</span>
            <ChevronRight aria-hidden className="size-5" />
          </Link>
        ))}
      </nav>

      <p className="flex items-start gap-2 rounded-xl bg-sand/70 px-4 py-3 text-sm text-muted">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        Puedes completar tu catálogo más tarde desde Mis tiendas.
        {store ? null : " En esta versión de prueba la tienda no se guarda."}
      </p>
    </div>
  );
}
