import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Checkbox or radio rendered as a pill. */
export function ToggleChip({
  type = "checkbox",
  name,
  value,
  label,
  icon: Icon,
  checked,
  onChange,
  className,
}: {
  type?: "checkbox" | "radio";
  name: string;
  value: string;
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
        checked ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink",
        className,
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {Icon ? <Icon aria-hidden className="size-5 shrink-0" /> : null}
      {label}
    </label>
  );
}
