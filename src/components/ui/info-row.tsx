import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{label}</p>
        <div className="text-muted">{children}</div>
      </div>
    </div>
  );
}
