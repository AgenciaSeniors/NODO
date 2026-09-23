import { expect, test } from "vitest";
import { parseAmount, parseProductForm, parseStoreForm } from "./listing-input";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const v of Array.isArray(value) ? value : [value]) data.append(key, v);
  }
  return data;
}

test.each([
  ["1500", 1500],
  ["1 500", 1500],
  ["1.500", 1500],
  ["1.500,50", 1500.5],
  ["12.000.000", 12_000_000],
  ["12.5", 12.5],
  ["12,5", 12.5],
  ["0,99", 0.99],
])("reads %s as %d", (input, expected) => {
  expect(parseAmount(input)).toBe(expected);
});

test.each(["", "abc", "1.2.3,4,5", "-5"])("rejects %s", (input) => {
  expect(parseAmount(input)).toBeNaN();
});

const store = {
  nombre: "  Mercado   El Sol ",
  categoria: "alimentos",
  descripcion: "Frutas y verduras",
  provincia: "la-habana",
  municipio: "plaza-de-la-revolucion",
  whatsapp: "5245 6789",
  pago: ["cash", "transfer", "bitcoin"],
  entrega: ["pickup"],
};

test("a valid store form becomes clean input", () => {
  const { input, errors } = parseStoreForm(form(store));
  expect(errors).toEqual({});
  expect(input).toMatchObject({
    name: "Mercado El Sol",
    whatsapp: "+5352456789",
    payment: ["cash", "transfer"],
    delivery: ["pickup"],
    address: "",
  });
});

test("store form errors name each field", () => {
  const { input, errors } = parseStoreForm(
    form({ ...store, nombre: "M", categoria: "armas", municipio: "moa", whatsapp: "7 123 4567", pago: [], entrega: [] }),
  );
  expect(input).toBeUndefined();
  expect(Object.keys(errors).sort()).toEqual(["category", "delivery", "municipality", "name", "payment", "whatsapp"]);
});

const product = {
  titulo: "Aceite 1 L",
  categoria: "alimentos",
  estado: "used",
  precio: "650",
  moneda: "CUP",
  modalidad: "unit_and_bulk",
  tramos: JSON.stringify([
    { minQty: "12", unitPrice: "600" },
    { minQty: "", unitPrice: "" },
    { minQty: "6", unitPrice: "620" },
  ]),
  provincia: "holguin",
  municipio: "moa",
  whatsapp: "+53 5 000 0300",
  pago: ["cash"],
  entrega: ["pickup", "delivery"],
};

test("a product form becomes clean input with sorted tiers", () => {
  const { input, errors } = parseProductForm(form(product));
  expect(errors).toEqual({});
  expect(input).toMatchObject({
    price: 650,
    // Food has no "new / used".
    condition: null,
    minQty: null,
    tiers: [
      { minQty: 6, unitPrice: 620 },
      { minQty: 12, unitPrice: 600 },
    ],
  });
});

test("bulk-only tiers must start above the minimum order", () => {
  const { errors } = parseProductForm(
    form({ ...product, modalidad: "bulk_only", minimo: "10", tramos: JSON.stringify([{ minQty: "8", unitPrice: "600" }]) }),
  );
  expect(errors.tiers).toMatch(/venta mínima/);
});

test("quantity pricing needs at least one tier, and tiers can't repeat", () => {
  expect(parseProductForm(form({ ...product, tramos: "[]" })).errors.tiers).toBeDefined();
  expect(parseProductForm(form({ ...product, tramos: "not json" })).errors.tiers).toBeDefined();
  const twice = JSON.stringify([
    { minQty: "6", unitPrice: "620" },
    { minQty: "6", unitPrice: "610" },
  ]);
  expect(parseProductForm(form({ ...product, tramos: twice })).errors.tiers).toMatch(/misma cantidad/);
});

test("unknown sale modes and currencies fall back to the defaults", () => {
  const { input } = parseProductForm(form({ ...product, modalidad: "gratis", moneda: "BTC", categoria: "hogar" }));
  expect(input).toMatchObject({ saleMode: "unit", currency: "CUP", tiers: [], condition: "used" });
});
