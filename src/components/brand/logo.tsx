import { HORIZONTAL, SYMBOL, VERTICAL } from "./logo-paths";

const GREEN = "#2FA84F";
const INK = "#1E2320";
const CREAM = "#FBF7EE";

type LogoProps = {
  variant?: "horizontal" | "vertical" | "symbol";
  /** "light" is for dark backgrounds: the wordmark turns cream. */
  tone?: "color" | "light";
  className?: string;
  title?: string;
};

export function Logo({ variant = "horizontal", tone = "color", className, title = "NODO" }: LogoProps) {
  if (variant === "symbol") {
    return (
      <svg viewBox={SYMBOL.viewBox} role="img" aria-label={title} className={className}>
        <path fill={GREEN} d={SYMBOL.path} />
      </svg>
    );
  }
  const art = variant === "vertical" ? VERTICAL : HORIZONTAL;
  return (
    <svg viewBox={art.viewBox} role="img" aria-label={title} className={className}>
      <path fill={GREEN} d={art.symbol} />
      <path fill={tone === "light" ? CREAM : INK} d={art.wordmark} />
    </svg>
  );
}
