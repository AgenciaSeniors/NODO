import { NamedIcon } from "@/components/ui/named-icon";
import { cn } from "@/lib/cn";
import type { StoreLogo } from "@/lib/types";

export function StoreAvatar({ logo, size = 56, className }: { logo: StoreLogo; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-extrabold tracking-tight", className)}
      style={{ width: size, height: size, background: logo.background, color: logo.foreground, fontSize: size * 0.36 }}
    >
      {logo.kind === "icon" ? (
        <NamedIcon name={logo.value} strokeWidth={2.2} style={{ width: size * 0.52, height: size * 0.52 }} />
      ) : (
        logo.value
      )}
    </span>
  );
}
