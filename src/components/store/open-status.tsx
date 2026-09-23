import { cn } from "@/lib/cn";
import { nearLabel } from "@/lib/place";
import type { Store } from "@/lib/types";

export function OpenStatus({ open }: { open: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", open ? "text-brand-700" : "text-muted")}>
      <span aria-hidden className={cn("size-2 rounded-full", open ? "bg-brand-500" : "bg-muted/60")} />
      {open ? "Abierto" : "Cerrado"}
    </span>
  );
}

/** "● Abierto · 900 m", or just the municipality while opening hours aren't known. */
export function StoreStatus({ store }: { store: Store }) {
  return (
    <>
      {store.openNow !== undefined ? (
        <>
          <OpenStatus open={store.openNow} />
          <span className="text-muted"> · </span>
        </>
      ) : null}
      <span className="text-muted">{nearLabel(store)}</span>
    </>
  );
}
