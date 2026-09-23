import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 bg-cream px-6 text-center">
      <Logo className="h-10 w-auto" />
      <span className="flex size-16 items-center justify-center rounded-full bg-sand text-muted">
        <WifiOff aria-hidden className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Estás sin conexión</h1>
        <p className="text-muted">
          Las páginas que ya visitaste siguen disponibles. Cuando vuelva la conexión, NODO se
          actualiza solo.
        </p>
      </div>
    </main>
  );
}
