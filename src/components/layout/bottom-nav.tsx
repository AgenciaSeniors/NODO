"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Plus, Store, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/publicar", label: "Publicar", icon: Plus },
  { href: "/tiendas", label: "Tiendas", icon: Store },
  { href: "/perfil", label: "Perfil", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // A product page belongs to Explorar.
  if (href === "/explorar" && pathname.startsWith("/producto")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-5 items-end px-1 pt-1.5 pb-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          if (href === "/publicar") {
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-1 text-xs font-semibold text-ink"
                >
                  <span className="-mt-7 flex size-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-4 ring-white">
                    <Icon aria-hidden className="size-7" strokeWidth={2.5} />
                  </span>
                  <span className={cn(active && "text-brand-700")}>{label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full max-w-20 flex-col items-center justify-center gap-1 rounded-2xl text-xs",
                  active ? "bg-brand-50 font-bold text-brand-700" : "font-medium text-muted",
                )}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
