import { expect, test } from "vitest";
import { tierRows } from "./tiers";

test("unit + quantity pricing", () => {
  expect(
    tierRows({ saleMode: "unit_and_bulk", price: 650, tiers: [{ minQty: 12, unitPrice: 590 }, { minQty: 6, unitPrice: 620 }] }),
  ).toEqual([
    { range: "1–5", unitPrice: 650 },
    { range: "6–11", unitPrice: 620 },
    { range: "12+", unitPrice: 590 },
  ]);
});

test("unit-only products have no table", () => {
  expect(tierRows({ saleMode: "unit", price: 10, tiers: [] })).toEqual([]);
});

test("adjacent tiers collapse to a single number", () => {
  expect(
    tierRows({ saleMode: "unit_and_bulk", price: 10, tiers: [{ minQty: 2, unitPrice: 9 }, { minQty: 3, unitPrice: 8 }] }),
  ).toEqual([
    { range: "1", unitPrice: 10 },
    { range: "2", unitPrice: 9 },
    { range: "3+", unitPrice: 8 },
  ]);
});

test("bulk-only pricing starts at the minimum order", () => {
  expect(
    tierRows({ saleMode: "bulk_only", minQty: 10, price: 3200, tiers: [{ minQty: 50, unitPrice: 3000 }] }),
  ).toEqual([
    { range: "10–49", unitPrice: 3200 },
    { range: "50+", unitPrice: 3000 },
  ]);
  expect(tierRows({ saleMode: "bulk_only", minQty: 10, price: 3200, tiers: [] })).toEqual([]);
});

test("the offer price applies to the base row", () => {
  expect(
    tierRows({ saleMode: "unit_and_bulk", price: 100, offerPrice: 90, tiers: [{ minQty: 5, unitPrice: 80 }] })[0],
  ).toEqual({ range: "1–4", unitPrice: 90 });
});
