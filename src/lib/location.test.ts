import { describe, expect, test, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const { parseLocation, safeReturnPath, serializeLocation } = await import("./location");

describe("location cookie", () => {
  test("round-trips province and municipality", () => {
    const value = serializeLocation("la-habana", "plaza-de-la-revolucion");
    expect(value).toBe("la-habana/plaza-de-la-revolucion");
    const parsed = parseLocation(value!);
    expect(parsed?.province.name).toBe("La Habana");
    expect(parsed?.municipality?.name).toBe("Plaza de la Revolución");
  });

  test("province only means the whole province", () => {
    expect(parseLocation("holguin")?.municipality).toBeUndefined();
  });

  test("rejects unknown or mismatched ids", () => {
    expect(serializeLocation("atlantida")).toBeNull();
    expect(serializeLocation("la-habana", "vinales")).toBeNull();
    expect(parseLocation("nope/nada")).toBeNull();
  });
});

describe("safeReturnPath", () => {
  test("keeps local paths", () => {
    expect(safeReturnPath("/tiendas?categoria=hogar")).toBe("/tiendas?categoria=hogar");
  });
  test("blocks external targets", () => {
    expect(safeReturnPath("https://evil.example")).toBe("/");
    expect(safeReturnPath("//evil.example")).toBe("/");
    expect(safeReturnPath("/\\evil.example")).toBe("/");
    expect(safeReturnPath(null)).toBe("/");
  });
});
