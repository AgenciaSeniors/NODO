import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/** Shared frame of the sign-in steps: back arrow, logo, title, form. */
export function AuthScreen({
  backHref,
  title,
  intro,
  children,
}: {
  backHref: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-cream px-5 pb-10">
      <header className="flex h-16 items-center">
        <Link href={backHref} aria-label="Volver" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeft aria-hidden className="size-6" />
        </Link>
      </header>
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="space-y-5 text-center">
          <Logo variant="vertical" className="mx-auto h-28 w-auto" />
          <p className="text-sm text-muted">Todo conecta cerca de ti.</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <div className="text-muted">{intro}</div>
        </div>
        {children}
      </div>
    </main>
  );
}
