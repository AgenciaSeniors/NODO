import { DEMO_MODE, SHOW_EXAMPLES } from "@/lib/mode";

/** Says when part of what's on screen is sample content. */
export function DemoBanner() {
  if (!SHOW_EXAMPLES) return null;
  return (
    <p className="bg-brand-700 px-4 py-1.5 text-center text-xs font-medium text-white">
      {DEMO_MODE ? "Versión de prueba · los datos son de ejemplo" : "NODO está empezando · lo marcado «Ejemplo» no es real"}
    </p>
  );
}
