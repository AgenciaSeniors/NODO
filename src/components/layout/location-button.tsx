import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { getLocation, locationLabel } from "@/lib/location";
import { cn } from "@/lib/cn";

/** "box" is the bordered field of Tiendas; "inline" the text link under the logo (Inicio, Explorar). */
export async function LocationButton({ returnTo, look = "box" }: { returnTo: string; look?: "box" | "inline" }) {
  const location = await getLocation();
  return (
    <Link
      href={`/ubicacion?volver=${encodeURIComponent(returnTo)}`}
      className={cn(
        "flex items-center gap-2",
        look === "box"
          ? "h-12 rounded-2xl border border-line bg-white px-4 shadow-sm"
          : "-my-1 min-h-11 max-w-full self-start text-[17px]",
      )}
    >
      <MapPin aria-hidden className={cn("shrink-0 text-brand-600", look === "box" ? "size-5" : "size-5 fill-brand-500 text-white")} strokeWidth={look === "box" ? 2 : 2.2} />
      <span className="sr-only">Ubicación actual: </span>
      <span className={cn("truncate font-medium", look === "box" && "flex-1")}>{locationLabel(location)}</span>
      <ChevronDown aria-hidden className={cn("size-5 shrink-0", look === "box" ? "text-muted" : "text-brand-600")} />
    </Link>
  );
}
