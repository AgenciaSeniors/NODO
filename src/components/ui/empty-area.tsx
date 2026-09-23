import Link from "next/link";
import { Sprout } from "lucide-react";

export function EmptyArea({ place }: { place: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center ring-1 ring-line/60">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Sprout aria-hidden className="size-7" />
      </span>
      <p className="font-bold">Todavía no hay publicaciones en {place}</p>
      <p className="text-sm text-muted">NODO está empezando. Publica lo que vendes y sé de los primeros de tu zona.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/publicar" className="flex h-11 items-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white">
          Publicar
        </Link>
        <Link href="/ubicacion" className="flex h-11 items-center rounded-full bg-sand px-5 text-sm font-semibold">
          Cambiar ubicación
        </Link>
      </div>
    </div>
  );
}
