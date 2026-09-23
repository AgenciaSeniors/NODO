import { expect, test } from "vitest";
import { fold, isUuid, matches, toPrefixQuery } from "./search";

test("fold drops accents and case, like the database's unaccent", () => {
  expect(fold("Café ÑAME Pingüino")).toBe("cafe name pinguino");
});

test("every word must match, in any order", () => {
  expect(matches("aceite 1 l", "Aceite vegetal 1 L")).toBe(true);
  expect(matches("aceite oliva", "Aceite vegetal 1 L")).toBe(false);
  expect(matches("  ", "anything")).toBe(true);
});

test("search text becomes a prefix query without tsquery syntax", () => {
  expect(toPrefixQuery("Tomates de Güira")).toBe("tomates:* & de:* & guira:*");
  expect(toPrefixQuery("a|b & c!(d)")).toBe("a:* & b:* & c:* & d:*");
  expect(toPrefixQuery("!!! ***")).toBeNull();
});

test("real ids are UUIDs, example ids are not", () => {
  expect(isUuid("3f0c8d9e-1b2a-4c5d-8e7f-0a1b2c3d4e5f")).toBe(true);
  expect(isUuid("p3")).toBe(false);
  expect(isUuid(undefined)).toBe(false);
});
