import { expect, test } from "vitest";
import { findMunicipality, PROVINCES } from "./cuba";

test("15 provinces plus Isla de la Juventud", () => {
  expect(PROVINCES).toHaveLength(16);
});

test("168 municipalities", () => {
  expect(PROVINCES.reduce((n, p) => n + p.municipalities.length, 0)).toBe(168);
});

test("ids are unique within each province", () => {
  for (const p of PROVINCES) {
    const ids = p.municipalities.map((m) => m.id);
    expect(new Set(ids).size, p.name).toBe(ids.length);
  }
  expect(new Set(PROVINCES.map((p) => p.id)).size).toBe(PROVINCES.length);
});

test("San Luis resolves per province", () => {
  expect(findMunicipality("pinar-del-rio", "san-luis")?.provinceId).toBe("pinar-del-rio");
  expect(findMunicipality("santiago-de-cuba", "san-luis")?.provinceId).toBe("santiago-de-cuba");
  expect(findMunicipality("la-habana", "san-luis")).toBeUndefined();
});
