import Link from "next/link";
import { Bell, ChevronLeft, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

type AppHeaderProps = {
  /** Shows a back arrow and centers the logo. */
  backHref?: string;
  action?: "notifications" | "settings" | "none";
};

const iconButton =
  "flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm ring-1 ring-line/60";

export function AppHeader({ backHref, action = "notifications" }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-3 px-4">
      {backHref ? (
        <Link href={backHref} className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full" aria-label="Volver">
          <ChevronLeft aria-hidden className="size-6" />
        </Link>
      ) : null}
      <Link href="/" className={cn("flex h-11 items-center", backHref && "mx-auto")}>
        <Logo className="h-10 w-auto" />
      </Link>
      <div className={cn("flex", !backHref && "ml-auto")}>
        {action === "notifications" ? (
          <Link href="/pronto?que=notificaciones" className={iconButton} aria-label="Notificaciones">
            <Bell aria-hidden className="size-5" />
          </Link>
        ) : action === "settings" ? (
          <Link href="/pronto?que=ajustes" className={iconButton} aria-label="Configuración">
            <Settings aria-hidden className="size-5" />
          </Link>
        ) : (
          <span className="size-11" aria-hidden />
        )}
      </div>
    </header>
  );
}
