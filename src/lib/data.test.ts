import { expect, test } from "vitest";
import { listProducts, listStores } from "./data";

test("stores are filtered by province and sorted with the user's municipality first", async () => {
  const stores = await listStores({ provinceId: "la-habana", municipalityId: "playa" });
  expect(stores[0].municipalityId).toBe("playa");
  expect(await listStores({ provinceId: "holguin" })).toEqual([]);
});

test("store search ignores accents and case", async () => {
  const [store] = await listStores({ q: "electronica" });
  expect(store.name).toBe("TecnoYagua");
});

test("'Por cantidad' keeps any product with quantity pricing", async () => {
  const products = await listProducts({ only: ["cantidad"] });
  expect(products.length).toBeGreaterThan(0);
  expect(products.every((p) => p.saleMode !== "unit")).toBe(true);
});

test("price sort compares currencies through the CUP estimate", async () => {
  const products = await listProducts({ sort: "precio-desc" });
  // 180 USD bicycle outranks the 12.000 CUP pot even though 180 < 12000.
  const titles = products.map((p) => p.title);
  expect(titles.indexOf("Bicicleta de paseo")).toBeLessThan(titles.indexOf("Olla de presión 6 L"));
});
