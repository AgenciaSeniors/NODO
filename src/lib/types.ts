// Domain types. They mirror the Supabase schema in supabase/migrations so the
// demo data module can be swapped for real queries without touching the UI.

export type Currency = "CUP" | "USD" | "EUR" | "MLC";
export type PaymentMethod = "cash" | "transfer";
export type DeliveryMethod = "pickup" | "delivery";
export type Condition = "new" | "used";

/** "Mayorista" is not an account type: any product can add quantity pricing. */
export type SaleMode = "unit" | "unit_and_bulk" | "bulk_only";

export type Availability =
  | "available"
  | "low_stock"
  | "out_of_stock"
  | "reserved"
  | "sold"
  | "hidden"
  | "archived"
  | "draft";

export type QuantityTier = { minQty: number; unitPrice: number };

export type StoreLogo = {
  /** Lucide icon name, initials drawn over a colored disc, or a photo URL. */
  kind: "icon" | "initials" | "image";
  value: string;
  background: string;
  foreground: string;
};

export type Store = {
  id: string;
  slug: string;
  name: string;
  category: string;
  /** Short line under the name, e.g. "Alimentos y bebidas". */
  tagline: string;
  description: string;
  provinceId: string;
  municipalityId: string;
  address: string;
  whatsapp: string;
  hours: string;
  /** Unknown until stores publish structured opening hours. */
  openNow?: boolean;
  payment: PaymentMethod[];
  delivery: DeliveryMethod[];
  deliveryNote?: string;
  verified: boolean;
  featured: boolean;
  isNew: boolean;
  productCount: number;
  /** Only example content has distances; real places show the municipality. */
  distanceKm?: number;
  logo: StoreLogo;
  createdAt?: Date;
  /** Sample content shown while NODO fills up; never contactable. */
  example?: boolean;
};

export type Seller =
  | { type: "store"; storeId: string; store?: Store }
  | { type: "person"; name: string; whatsapp: string; memberSince: string; rating?: number };

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: Condition | null;
  price: number;
  currency: Currency;
  /** Promotional price shown next to the regular one. */
  offerPrice?: number;
  saleMode: SaleMode;
  tiers: QuantityTier[];
  /** Minimum order for bulk_only products. */
  minQty?: number;
  unitLabel: string;
  availability: Availability;
  confirmedAt: Date;
  createdAt: Date;
  /** Photos in display order: full size and a small thumbnail for cards. */
  images?: Array<{ src: string; thumb: string }>;
  seller: Seller;
  /** Contact number for this listing when it differs from the store's. */
  whatsapp?: string;
  provinceId: string;
  municipalityId: string;
  payment: PaymentMethod[];
  delivery: DeliveryMethod[];
  deliveryNote?: string;
  /** Paid placement: must always be labelled "Destacado". */
  sponsored: boolean;
  distanceKm?: number;
  example?: boolean;
};

export type PlanId = "gratis" | "pro" | "negocio";

export type DemoUser = {
  name: string;
  initials: string;
  rating: number;
  verified: boolean;
  provinceId: string;
  plan: { name: string; activeListings: number; limit: number };
  storeIds: string[];
};
