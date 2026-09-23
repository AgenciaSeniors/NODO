import { CATEGORIES, CURRENCIES } from "@/lib/catalog";
import { findMunicipality } from "@/lib/geo/cuba";
import { toE164 } from "@/lib/phone";
import type { Condition, Currency, DeliveryMethod, PaymentMethod, QuantityTier, SaleMode } from "@/lib/types";

// What the "Crear tienda" and "Publicar" forms send, checked the same way in
// the browser (instant feedback) and on the server (the one that counts).

export type FieldErrors = Record<string, string>;

const PAYMENTS: PaymentMethod[] = ["cash", "transfer"];
const DELIVERIES: DeliveryMethod[] = ["pickup", "delivery"];
const SALE_MODES: SaleMode[] = ["unit", "unit_and_bulk", "bulk_only"];
/** "Nuevo / Usado" only makes sense for goods that can be second-hand. */
export const NO_CONDITION = new Set(["alimentos", "salud"]);
export const PHONE_ERROR = "Escribe un móvil cubano de 8 dígitos (empieza por 5 o 6).";

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim().replace(/\s+/g, " ");
const longText = (data: FormData, key: string) => String(data.get(key) ?? "").trim().replace(/\r\n/g, "\n");

function pick<T extends string>(data: FormData, key: string, allowed: readonly T[]): T[] {
  return [...new Set(data.getAll(key).map(String))].filter((v): v is T => allowed.includes(v as T));
}

/**
 * Prices as people type them: "1500", "1 500", "1.500" and "1.500,50" are
 * all read the Cuban way (dot for thousands); "12.5" or "12,5" are decimals.
 */
export function parseAmount(input: string): number {
  let value = input.replace(/\s/g, "");
  if (value.includes(".") && value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}([.,]\d{3})+$/.test(value)) value = value.replace(/[.,]/g, "");
  else value = value.replace(",", ".");
  const amount = /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN;
  return Math.round(amount * 100) / 100;
}

const MAX_PRICE = 1_000_000_000;

function checkPlace(data: FormData, errors: FieldErrors) {
  const provinceId = text(data, "provincia");
  const municipalityId = text(data, "municipio");
  if (!provinceId) errors.province = "Elige la provincia.";
  else if (!findMunicipality(provinceId, municipalityId)) errors.municipality = "Elige el municipio.";
  return { provinceId, municipalityId };
}

function checkTerms(data: FormData, errors: FieldErrors) {
  const payment = pick(data, "pago", PAYMENTS);
  const delivery = pick(data, "entrega", DELIVERIES);
  const whatsapp = toE164(text(data, "whatsapp"));
  if (payment.length === 0) errors.payment = "Marca al menos una forma de pago.";
  if (delivery.length === 0) errors.delivery = "Marca al menos una forma de entrega.";
  if (!whatsapp) errors.whatsapp = PHONE_ERROR;
  return { payment, delivery, whatsapp: whatsapp ?? "" };
}

export type StoreInput = {
  name: string;
  category: string;
  description: string;
  provinceId: string;
  municipalityId: string;
  address: string;
  whatsapp: string;
  hours: string;
  payment: PaymentMethod[];
  delivery: DeliveryMethod[];
};

export function parseStoreForm(data: FormData): { input?: StoreInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const name = text(data, "nombre");
  const category = text(data, "categoria");
  if (name.length < 2) errors.name = "Escribe el nombre de la tienda.";
  else if (name.length > 60) errors.name = "El nombre puede tener hasta 60 letras.";
  if (!CATEGORIES.some((c) => c.id === category)) errors.category = "Elige una categoría.";
  const place = checkPlace(data, errors);
  const terms = checkTerms(data, errors);
  const input: StoreInput = {
    name,
    category,
    description: longText(data, "descripcion").slice(0, 200),
    address: text(data, "direccion").slice(0, 160),
    hours: text(data, "horario").slice(0, 80),
    ...place,
    ...terms,
  };
  return Object.keys(errors).length > 0 ? { errors } : { input, errors };
}

export type ProductInput = {
  title: string;
  category: string;
  condition: Condition | null;
  description: string;
  price: number;
  currency: Currency;
  saleMode: SaleMode;
  minQty: number | null;
  tiers: QuantityTier[];
  provinceId: string;
  municipalityId: string;
  whatsapp: string;
  payment: PaymentMethod[];
  delivery: DeliveryMethod[];
};

/** Tiers arrive as JSON: [{ "minQty": "12", "unitPrice": "400" }, …]. Empty rows are ignored. */
function readTiers(raw: string): Array<{ minQty: string; unitPrice: string }> {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return value
      .slice(0, 20)
      .map((t) => ({ minQty: String(t?.minQty ?? "").trim(), unitPrice: String(t?.unitPrice ?? "").trim() }))
      .filter((t) => t.minQty || t.unitPrice);
  } catch {
    return [];
  }
}

/** Step 1 of "Publicar": the product itself. */
export function checkProductDetails(data: FormData, errors: FieldErrors = {}) {
  const title = text(data, "titulo");
  const category = text(data, "categoria");
  const price = parseAmount(text(data, "precio"));
  const saleMode = SALE_MODES.find((m) => m === text(data, "modalidad")) ?? "unit";
  const currency = CURRENCIES.find((c) => c === text(data, "moneda")) ?? "CUP";
  const minQtyText = text(data, "minimo");
  const minQty = saleMode === "bulk_only" ? Number(minQtyText) : null;

  if (title.length < 3) errors.title = "Escribe el nombre del producto.";
  else if (title.length > 80) errors.title = "El nombre puede tener hasta 80 letras.";
  if (!CATEGORIES.some((c) => c.id === category)) errors.category = "Elige una categoría.";
  if (!(price > 0) || price >= MAX_PRICE) errors.price = "Escribe un precio mayor que 0.";
  if (minQty !== null && !(Number.isInteger(minQty) && minQty >= 2 && minQty <= 1_000_000)) {
    errors.minQty = "Indica la cantidad mínima (2 o más).";
  }

  const tiers: QuantityTier[] = [];
  if (saleMode !== "unit") {
    const rows = readTiers(String(data.get("tramos") ?? ""));
    if (saleMode === "unit_and_bulk" && rows.length === 0) errors.tiers = "Agrega al menos un precio por cantidad.";
    const seen = new Set<number>();
    for (const row of rows) {
      const qty = Number(row.minQty);
      const unitPrice = parseAmount(row.unitPrice);
      if (!Number.isInteger(qty) || qty < 2 || qty > 1_000_000) errors.tiers = "Cada rango empieza en 2 unidades o más.";
      else if (minQty !== null && qty <= minQty) errors.tiers = "Los rangos empiezan por encima de la venta mínima.";
      else if (!(unitPrice > 0) || unitPrice >= MAX_PRICE) errors.tiers = "Cada rango necesita un precio.";
      else if (seen.has(qty)) errors.tiers = "Hay dos rangos con la misma cantidad.";
      else tiers.push({ minQty: qty, unitPrice });
      seen.add(qty);
    }
  }

  return {
    title,
    category,
    condition: NO_CONDITION.has(category) ? null : text(data, "estado") === "used" ? ("used" as const) : ("new" as const),
    description: longText(data, "descripcion").slice(0, 600),
    price,
    currency,
    saleMode,
    minQty,
    tiers: tiers.sort((a, b) => a.minQty - b.minQty),
  };
}

/** Step 2 of "Publicar": how and where it is sold. */
export function checkSaleTerms(data: FormData, errors: FieldErrors = {}) {
  return { ...checkPlace(data, errors), ...checkTerms(data, errors) };
}

export function parseProductForm(data: FormData): { input?: ProductInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const input = { ...checkProductDetails(data, errors), ...checkSaleTerms(data, errors) };
  return Object.keys(errors).length > 0 ? { errors } : { input, errors };
}
