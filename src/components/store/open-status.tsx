import { cn } from "@/lib/cn";

export function OpenStatus({ open }: { open: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", open ? "text-brand-700" : "text-muted")}>
      <span aria-hidden className={cn("size-2 rounded-full", open ? "bg-brand-500" : "bg-muted/60")} />
      {open ? "Abierto" : "Cerrado"}
    </span>
  );
}
