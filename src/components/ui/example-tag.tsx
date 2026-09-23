import { cn } from "@/lib/cn";

/** Marks sample content shown while NODO fills up with real listings. */
export function ExampleTag({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-semibold text-white", className)}>Ejemplo</span>
  );
}
