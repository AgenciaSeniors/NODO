import {
  Car,
  Flower2,
  Hammer,
  HeartPulse,
  House,
  Laptop,
  Leaf,
  Package,
  Shirt,
  ShoppingBasket,
  Store,
  Sun,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Icons referenced by name from data (categories, store logos). Listed
// explicitly so only these end up in the bundle.
const ICONS: Record<string, LucideIcon> = {
  Car,
  Flower2,
  Hammer,
  HeartPulse,
  House,
  Laptop,
  Leaf,
  Package,
  Shirt,
  ShoppingBasket,
  Store,
  Sun,
};

export function NamedIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Package;
  return <Icon aria-hidden {...props} />;
}
