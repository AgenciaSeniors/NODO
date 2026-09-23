"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Ordenar</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams);
          params.set("orden", e.target.value);
          router.replace(`${pathname}?${params}`);
        }}
        className="h-11 rounded-xl border border-line bg-white px-3 font-semibold"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
