import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 aria-invalid:border-danger-600";

export const selectClass = cn(inputClass, "appearance-none pr-10");

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Native select (best on phones) with a visible chevron. */
export function Select({ className, wrapperClassName, ...props }: ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select {...props} className={cn(selectClass, className)} />
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted" />
    </div>
  );
}
