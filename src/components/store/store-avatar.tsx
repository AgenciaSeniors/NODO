import { NamedIcon } from "@/components/ui/named-icon";
import { cn } from "@/lib/cn";
import type { StoreLogo } from "@/lib/types";

export function StoreAvatar({ logo, size = 56, className }: { logo: StoreLogo; size?: number; className?: string }) {
  if (logo.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- already resized on upload and served from /fotos
      <img
        src={logo.value}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size, background: logo.background }}
      />
    );
  }
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
