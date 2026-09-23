import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { getLocation, locationLabel } from "@/lib/location";

export async function LocationButton({ returnTo }: { returnTo: string }) {
  const location = await getLocation();
  return (
    <Link
      href={`/ubicacion?volver=${encodeURIComponent(returnTo)}`}
      className="flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-white px-4 shadow-sm"
    >
      <MapPin aria-hidden className="size-5 shrink-0 text-brand-600" />
      <span className="sr-only">Ubicación actual: </span>
      <span className="flex-1 truncate font-medium">{locationLabel(location)}</span>
      <ChevronDown aria-hidden className="size-5 shrink-0 text-muted" />
    </Link>
  );
}
