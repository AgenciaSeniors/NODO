import type { Metadata } from "next";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = { title: "Próximamente" };

// Destinations that exist in the design but are not built yet.
const FEATURES: Record<string, string> = {
  notificaciones: "Las notificaciones",
  ajustes: "La configuración de la cuenta",
  publicaciones: "Mis publicaciones",
  favoritos: "Tus favoritos",
  "seguir-tiendas": "Seguir tiendas",
  valoraciones: "Las valoraciones",
  ayuda: "Ayuda y soporte",
  sesion: "El inicio y cierre de sesión",
  "administrar-tienda": "El panel de tu tienda",
  "carga-masiva": "La carga de varios productos a la vez",
  planes: "Los planes Pro y Negocio",
  reportes: "Reportar publicaciones",
};

export default async function ComingSoonPage({ searchParams }: PageProps<"/pronto">) {
  const { que } = await searchParams;
  const feature = (typeof que === "string" && FEATURES[que]) || "Esta sección";
  return (
    <>
      <AppHeader backHref="/" action="none" />
      <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Hourglass aria-hidden className="size-8" />
        </span>
        <h1 className="text-2xl font-bold">{feature} llegará pronto</h1>
        <p className="text-muted">Estamos construyendo NODO por partes. Esta función estará en una próxima versión.</p>
        <Link href="/" className="flex h-12 items-center rounded-2xl bg-brand-600 px-6 font-semibold text-white">
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
