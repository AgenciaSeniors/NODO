import { expect, test } from "vitest";
import { normalizePhone, toE164 } from "./phone";

test.each([
  ["52456789", "+53 5 245 6789"],
  ["+53 5 245 6789", "+53 5 245 6789"],
  ["53-5245-6789", "+53 5 245 6789"],
  ["6 123 4567", "+53 6 123 4567"],
  ["+1 305 555 0100", "+13055550100"],
])("%s → %s", (input, expected) => {
  expect(normalizePhone(input)).toBe(expected);
});

test.each(["", "1234", "72345678", "5245678", "+53 7 123 4567"])("rejects %s", (input) => {
  expect(normalizePhone(input)).toBeNull();
});

test("the database stores numbers without spaces", () => {
  expect(toE164("5245 6789")).toBe("+5352456789");
  expect(toE164("+1 305 555 0100")).toBe("+13055550100");
  expect(toE164("123")).toBeNull();
});
