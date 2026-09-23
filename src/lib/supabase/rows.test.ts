import { expect, test } from "vitest";
import { toProduct, toStore, type ProductRow, type StoreRow } from "./rows";

const storeRow: StoreRow = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "mercado-el-sol",
  name: "Mercado El Sol",
  logo_path: null,
  category: "alimentos",
  description: "Frutas",
  province_id: "la-habana",
  municipality_id: "playa",
  address: null,
  whatsapp: "+5352456789",
  hours: null,
  payment: ["cash"],
  delivery: ["pickup", "delivery"],
  delivery_note: "200 CUP",
  verified: false,
  created_at: "2026-09-20T10:00:00Z",
  products: [{ count: 3 }],
};

const productRow: ProductRow = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Aceite 1 L",
  description: "",
  category: "alimentos",
  condition: null,
  price: "650.00",
  offer_price: null,
  currency: "CUP",
  sale_mode: "unit_and_bulk",
  min_qty: null,
  unit_label: "unidad",
  availability: "available",
  confirmed_at: "2026-09-23T09:00:00Z",
  created_at: "2026-09-22T09:00:00Z",
  province_id: "la-habana",
  municipality_id: "playa",
  whatsapp: null,
  payment: null,
  delivery: null,
  delivery_note: null,
  owner_user_id: null,
  quantity_tiers: [
    { min_qty: 24, unit_price: "580" },
    { min_qty: 12, unit_price: 600 },
  ],
  product_images: [
    { path: "u/p/1-b.webp", position: 1 },
    { path: "u/p/0-a.webp", position: 0 },
  ],
  store: storeRow,
  owner: null,
};

test("a store row becomes a store with initials in its category colors", () => {
  const store = toStore(storeRow, new Date("2026-09-23T00:00:00Z"));
  expect(store).toMatchObject({
    tagline: "Alimentos",
    whatsapp: "+53 5 245 6789",
    address: "",
    hours: "",
    isNew: true,
    featured: false,
    productCount: 3,
    logo: { kind: "initials", value: "ME", background: "#FFF1C7" },
  });
  expect(store.openNow).toBeUndefined();
  expect(store.distanceKm).toBeUndefined();
});

test("a store logo is served from our own domain", () => {
  const store = toStore({ ...storeRow, logo_path: "u/s-logo.webp" });
  expect(store.logo).toMatchObject({ kind: "image", value: "/fotos/store-logos/u/s-logo.webp" });
});

test("a store product inherits the store's terms and keeps photos in order", () => {
  const product = toProduct(productRow);
  expect(product.price).toBe(650);
  expect(product.tiers).toEqual([
    { minQty: 12, unitPrice: 600 },
    { minQty: 24, unitPrice: 580 },
  ]);
  expect(product.payment).toEqual(["cash"]);
  expect(product.delivery).toEqual(["pickup", "delivery"]);
  expect(product.deliveryNote).toBe("200 CUP");
  expect(product.whatsapp).toBeUndefined();
  expect(product.images).toEqual([
    { src: "/fotos/product-images/u/p/0-a.webp", thumb: "/fotos/product-images/u/p/0-a-mini.webp", path: "u/p/0-a.webp" },
    { src: "/fotos/product-images/u/p/1-b.webp", thumb: "/fotos/product-images/u/p/1-b-mini.webp", path: "u/p/1-b.webp" },
  ]);
  expect(product.seller).toMatchObject({ type: "store", storeId: storeRow.id });
});

test("a personal listing shows a short name and its own number", () => {
  const product = toProduct({
    ...productRow,
    store: null,
    owner_user_id: "33333333-3333-4333-8333-333333333333",
    whatsapp: "+5350000300",
    payment: ["transfer"],
    delivery: ["pickup"],
    owner: { full_name: "Carla Díaz Pérez", created_at: "2025-03-01T00:00:00Z" },
  });
  expect(product.seller).toEqual({ type: "person", name: "Carla D.", whatsapp: "+53 5 000 0300", memberSince: "2025" });
  expect(product.payment).toEqual(["transfer"]);
  expect(product.ownerUserId).toBe("33333333-3333-4333-8333-333333333333");
});
