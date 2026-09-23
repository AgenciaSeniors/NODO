import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Star,
  Store,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { StoreAvatar } from "@/components/store/store-avatar";
import { signOut } from "@/app/entrar/actions";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { findProvince } from "@/lib/geo/cuba";
import { getLocation } from "@/lib/location";
import { LOGIN_METHOD } from "@/lib/mode";

export const metadata: Metadata = { title: "Perfil" };

function MenuItem({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center gap-4 px-4">
        <Icon aria-hidden className="size-6 shrink-0" strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        <ChevronRight aria-hidden className="size-5 text-muted" />
      </Link>
    </li>
  );
}

const card = "rounded-2xl bg-white shadow-sm ring-1 ring-line/60";

function SignedOut() {
  return (
    <>
      <AppHeader />
      <div className="space-y-4 px-4 pb-6">
        <section className={`${card} flex flex-col items-center gap-3 p-6 text-center`}>
          <span className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <LogIn aria-hidden className="size-8" />
          </span>
          <h1 className="text-xl font-bold">Entra a NODO</h1>
          <p className="text-sm text-muted">
            {LOGIN_METHOD === "code"
              ? "Publica productos y crea tu tienda. Solo necesitas tu correo: te enviamos un código, sin contraseñas."
              : "Publica productos y crea tu tienda. Solo necesitas un correo y una contraseña."}
          </p>
          {LOGIN_METHOD === "code" ? (
            <Link
              href="/entrar?volver=/perfil"
              className="flex h-13 w-full items-center justify-center rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm"
            >
              Entrar con mi correo
            </Link>
          ) : (
            <div className="grid w-full gap-2">
              <Link
                href="/entrar?volver=/perfil&modo=crear"
                className="flex h-13 items-center justify-center rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm"
              >
                Crear cuenta
              </Link>
              <Link
                href="/entrar?volver=/perfil"
                className="flex h-13 items-center justify-center rounded-2xl bg-white text-lg font-semibold ring-1 ring-line"
              >
                Ya tengo cuenta
              </Link>
            </div>
          )}
        </section>
        <ul className={`${card} divide-y divide-line`}>
          <MenuItem href="/perfil/favoritos" icon={Heart} label="Favoritos" />
          <MenuItem href="/ubicacion?volver=/perfil" icon={MapPin} label="Ubicación" />
          <MenuItem href="/pronto?que=ayuda" icon={CircleHelp} label="Ayuda y soporte" />
        </ul>
      </div>
    </>
  );
}

export default async function ProfilePage() {
  const [user, location] = await Promise.all([getViewer(), getLocation()]);
  if (!user) return <SignedOut />;
  const { plan } = user;
  const usage = Math.min(100, Math.round((plan.activeListings / plan.limit) * 100));
  const province = findProvince(user.provinceId)?.name ?? location?.province.name;

  return (
    <>
      <AppHeader action="settings" />
      <div className="space-y-4 px-4 pb-6">
        <section className="flex items-center gap-4 py-2">
          <span
            aria-hidden
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700"
          >
            {user.initials}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="flex items-center gap-1 text-xl font-bold">
              <span className="truncate">{user.name || "Sin nombre"}</span>
              <Link
                href="/entrar/nombre?volver=/perfil"
                aria-label="Cambiar nombre"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted"
              >
                <Pencil aria-hidden className="size-4" />
              </Link>
            </h1>
            {user.rating !== undefined || user.verified ? (
              <p className="flex items-center gap-2 text-sm">
                {user.rating !== undefined ? (
                  <span className="flex items-center gap-1">
                    <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" />
                    {user.rating}
                    <span className="sr-only">de valoración</span>
                  </span>
                ) : null}
                {user.verified ? (
                  <span
                    className={cn(
                      "flex items-center gap-1 font-semibold text-brand-700",
                      user.rating !== undefined && "border-l border-line pl-2",
                    )}
                  >
                    <BadgeCheck aria-hidden className="size-4 fill-brand-500 text-white" />
                    Verificado
                  </span>
                ) : null}
              </p>
            ) : null}
            {user.email ? <p className="truncate text-sm text-muted">{user.email}</p> : null}
            {province ? (
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin aria-hidden className="size-4" />
                {province}
              </p>
            ) : null}
          </div>
        </section>

        <section className={`${card} flex items-center gap-4 p-4`}>
          <div className="flex-1 space-y-2">
            <p className="font-bold">{plan.name}</p>
            <p className="text-sm text-muted">
              {plan.activeListings} / {plan.limit} publicaciones activas
            </p>
            <div
              role="progressbar"
              aria-label="Publicaciones activas usadas"
              aria-valuenow={plan.activeListings}
              aria-valuemin={0}
              aria-valuemax={plan.limit}
              className="h-2 overflow-hidden rounded-full bg-sand"
            >
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${usage}%` }} />
            </div>
          </div>
          <Link
            href="/pronto?que=planes"
            className="flex h-12 items-center rounded-2xl bg-brand-50 px-4 font-semibold text-brand-700"
          >
            Mejorar plan
          </Link>
        </section>

        <ul className={`${card} divide-y divide-line`}>
          <MenuItem href="/pronto?que=publicaciones" icon={FileText} label="Mis publicaciones" />
          <MenuItem href="/perfil/favoritos" icon={Heart} label="Favoritos" />
          <MenuItem href="/pronto?que=seguir-tiendas" icon={Store} label="Tiendas que sigo" />
          <MenuItem href="/pronto?que=valoraciones" icon={Star} label="Valoraciones" />
        </ul>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Mis tiendas</h2>
          <div className={`${card} divide-y divide-line`}>
            {user.stores.length === 0 ? (
              <p className="p-4 text-sm text-muted">¿Tienes un negocio? Crea su tienda gratis y reúne todos sus productos en un catálogo.</p>
            ) : null}
            {user.stores.map((store) => (
              <div key={store.id} className="flex items-center gap-3 p-4">
                <Link href={`/tiendas/${store.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <StoreAvatar logo={store.logo} size={52} className="rounded-xl" />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{store.name}</span>
                    <span className="block text-sm text-muted">{store.productCount} productos</span>
                  </span>
                </Link>
                <Link
                  href="/pronto?que=administrar-tienda"
                  className="flex h-11 items-center rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-700"
                >
                  Administrar
                </Link>
              </div>
            ))}
            <div className="p-4">
              <Link
                href="/perfil/tiendas/nueva"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-500/60 bg-brand-50/60 font-semibold text-brand-700"
              >
                <Plus aria-hidden className="size-5" />
                Crear nueva tienda
              </Link>
            </div>
          </div>
        </section>

        <ul className={`${card} divide-y divide-line`}>
          <MenuItem href="/pronto?que=notificaciones" icon={Bell} label="Notificaciones" />
          <MenuItem href="/ubicacion?volver=/perfil" icon={MapPin} label="Ubicación" />
          <MenuItem href="/pronto?que=ayuda" icon={CircleHelp} label="Ayuda y soporte" />
        </ul>

        <form action={signOut}>
          <button
            type="submit"
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-danger-50 font-semibold text-danger-600 ring-1 ring-danger-600/20"
          >
            <LogOut aria-hidden className="size-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
