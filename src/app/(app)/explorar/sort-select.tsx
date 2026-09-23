"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { value: "recomendados", label: "Recomendados" },
  { value: "recientes", label: "Más recientes" },
  { value: "cerca", label: "Más cerca" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
];

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <div className="relative">
      <label htmlFor="orden" className="sr-only">
        Ordenar por
      </label>
      <select
        id="orden"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          params.set("orden", e.target.value);
          router.replace(`${pathname}?${params}`);
        }}
        className="h-11 appearance-none rounded-xl bg-transparent pr-7 pl-2 text-right font-medium"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-0 size-5 -translate-y-1/2" />
    </div>
  );
}
