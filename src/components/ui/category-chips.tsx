import { NamedIcon } from "@/components/ui/named-icon";
import { ChipLink } from "@/components/ui/chip-link";
import { CATEGORIES } from "@/lib/catalog";

type CategoryChipsProps = {
  basePath: string;
  active?: string;
  /** Other query params to keep in the links. */
  keep?: Record<string, string | undefined>;
};

export function CategoryChips({ basePath, active, keep = {} }: CategoryChipsProps) {
  const hrefFor = (category?: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(keep)) if (value) params.set(key, value);
    if (category) params.set("categoria", category);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };
  return (
    <nav aria-label="Categorías" className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4">
      {CATEGORIES.map((c) => (
        <ChipLink key={c.id} href={hrefFor(c.id === active ? undefined : c.id)} active={c.id === active}>
          <NamedIcon name={c.icon} className="size-4" />
          {c.label}
        </ChipLink>
      ))}
    </nav>
  );
}
