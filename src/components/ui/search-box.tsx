import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type SearchBoxProps = {
  id: string;
  action: string;
  placeholder: string;
  defaultValue?: string;
  /** Extra query params to keep when searching (active filters). */
  keep?: Record<string, string | undefined>;
  className?: string;
};

export function SearchBox({ id, action, placeholder, defaultValue, keep = {}, className }: SearchBoxProps) {
  return (
    <Form action={action} role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        enterKeyHint="search"
        className={cn(
          "h-13 w-full rounded-2xl border border-line bg-white pr-4 pl-12 text-base shadow-sm outline-none placeholder:text-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          className,
        )}
      />
      {Object.entries(keep).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
    </Form>
  );
}
