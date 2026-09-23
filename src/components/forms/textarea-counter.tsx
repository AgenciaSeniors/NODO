"use client";

import { inputClass } from "@/components/forms/field";
import { cn } from "@/lib/cn";

export function TextareaCounter({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        maxLength={maxLength}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${id}-count`}
        className={cn(inputClass, "h-auto resize-none py-3 pb-7")}
      />
      <span id={`${id}-count`} className="absolute right-3 bottom-2 text-xs text-muted" aria-live="polite">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
