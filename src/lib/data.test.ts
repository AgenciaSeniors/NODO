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

test("example ids never reach the database and are found by id", async () => {
  const { getProduct, getProductsByIds, getStoreById } = await import("./data");
  expect((await getProduct("p1"))?.title).toBeDefined();
  expect(await getProduct("3f0c8d9e-1b2a-4c5d-8e7f-0a1b2c3d4e5f")).toBeUndefined();
  expect((await getStoreById("s1"))?.slug).toBe("mercado-el-sol");
  const saved = await getProductsByIds(["p3", "nope", "p1"]);
  expect(saved.map((p) => p.id)).toEqual(["p3", "p1"]);
});

test("store products carry their store, so cards need no extra lookup", async () => {
  const [product] = await listProducts({ storeId: "s1", limit: 1 });
  expect(product.seller).toMatchObject({ type: "store", store: { id: "s1" } });
});
