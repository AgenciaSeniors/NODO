import { findCategory } from "@/lib/catalog";
import { initials, shortName } from "@/lib/format";
import { normalizePhone } from "@/lib/phone";
import { photoUrl, thumbPath } from "@/lib/photos";
import type {
  Availability,
  Condition,
  Currency,
  DeliveryMethod,
  PaymentMethod,
  Product,
  SaleMode,
  Store,
} from "@/lib/types";

// Database rows → the domain types the UI already uses. Kept free of any
// Supabase client code so it can be unit tested.

export const STORE_COLUMNS =
  "id, slug, name, logo_path, category, description, province_id, municipality_id, address, whatsapp, hours, payment, delivery, delivery_note, verified, created_at";

export type StoreRow = {
  id: string;
  slug: string;
  name: string;
  logo_path: string | null;
  category: string;
  description: string;
  province_id: string;
  municipality_id: string;
  address: string | null;
  whatsapp: string;
  hours: string | null;
  payment: string[];
  delivery: string[];
  delivery_note: string | null;
  verified: boolean;
  created_at: string;
  /** Present when selected as `products(count)`. */
  products?: Array<{ count: number }>;
};

export const PRODUCT_COLUMNS = `id, title, description, category, condition, price, offer_price, currency, sale_mode,
  min_qty, unit_label, availability, confirmed_at, created_at, province_id, municipality_id, whatsapp, payment,
  delivery, delivery_note, owner_user_id,
  quantity_tiers (min_qty, unit_price),
  product_images (path, position),
  store:stores (${STORE_COLUMNS}),
  owner:profiles!products_owner_user_id_fkey (full_name, created_at)`;

export type ProductRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string | null;
  price: number | string;
  offer_price: number | string | null;
  currency: string;
  sale_mode: string;
  min_qty: number | null;
  unit_label: string;
  availability: string;
  confirmed_at: string;
  created_at: string;
  province_id: string;
  municipality_id: string;
  whatsapp: string | null;
  payment: string[] | null;
  delivery: string[] | null;
  delivery_note: string | null;
  owner_user_id: string | null;
  quantity_tiers: Array<{ min_qty: number; unit_price: number | string }> | null;
  product_images: Array<{ path: string; position: number }> | null;
  store: StoreRow | null;
  owner: { full_name: string; created_at: string } | null;
};

const NEW_STORE_DAYS = 30;

export function toStore(row: StoreRow, now: Date = new Date()): Store {
  const category = findCategory(row.category);
  const createdAt = new Date(row.created_at);
  const colors = { background: category?.tint ?? "#EFEAE0", foreground: category?.ink ?? "#5B625D" };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    tagline: category?.label ?? "",
    description: row.description,
    provinceId: row.province_id,
    municipalityId: row.municipality_id,
    address: row.address ?? "",
    whatsapp: normalizePhone(row.whatsapp) ?? row.whatsapp,
    hours: row.hours ?? "",
    payment: row.payment as PaymentMethod[],
    delivery: row.delivery as DeliveryMethod[],
    deliveryNote: row.delivery_note ?? undefined,
    verified: row.verified,
    featured: false,
    isNew: now.getTime() - createdAt.getTime() < NEW_STORE_DAYS * 86_400_000,
    productCount: row.products?.[0]?.count ?? 0,
    logo: row.logo_path
      ? { kind: "image", value: photoUrl("store-logos", row.logo_path), ...colors }
      : { kind: "initials", value: initials(row.name) || "T", ...colors },
    createdAt,
  };
}

export function toProduct(row: ProductRow): Product {
  const store = row.store ? toStore(row.store) : undefined;
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      src: photoUrl("product-images", i.path),
      thumb: photoUrl("product-images", thumbPath(i.path)),
      path: i.path,
    }));
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition as Condition | null,
    price: Number(row.price),
    currency: row.currency as Currency,
    offerPrice: row.offer_price == null ? undefined : Number(row.offer_price),
    saleMode: row.sale_mode as SaleMode,
    tiers: (row.quantity_tiers ?? [])
      .map((t) => ({ minQty: t.min_qty, unitPrice: Number(t.unit_price) }))
      .sort((a, b) => a.minQty - b.minQty),
    minQty: row.min_qty ?? undefined,
    unitLabel: row.unit_label,
    availability: row.availability as Availability,
    confirmedAt: new Date(row.confirmed_at),
    createdAt: new Date(row.created_at),
    images,
    seller: store
      ? { type: "store", storeId: store.id, store }
      : {
          type: "person",
          name: shortName(row.owner?.full_name ?? "") || "Vendedor particular",
          whatsapp: normalizePhone(row.whatsapp ?? "") ?? row.whatsapp ?? "",
          memberSince: String(new Date(row.owner?.created_at ?? row.created_at).getFullYear()),
        },
    ownerUserId: row.owner_user_id ?? undefined,
    // A store product can override the store's number and terms.
    whatsapp: store && row.whatsapp ? (normalizePhone(row.whatsapp) ?? row.whatsapp) : undefined,
    provinceId: row.province_id,
    municipalityId: row.municipality_id,
    payment: (row.payment ?? store?.payment ?? ["cash"]) as PaymentMethod[],
    delivery: (row.delivery ?? store?.delivery ?? ["pickup"]) as DeliveryMethod[],
    deliveryNote: row.delivery_note ?? store?.deliveryNote,
    sponsored: false,
  };
}
