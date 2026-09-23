import { expect, test } from "vitest";
import { allowedStatuses, isStale, tabOf } from "./listing-status";

const now = new Date("2026-09-23T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

test("people and stores get different statuses", () => {
  expect(allowedStatuses({ seller: { type: "person", name: "Ana", whatsapp: "", memberSince: "2026" } })).toContain("sold");
  expect(allowedStatuses({ seller: { type: "store", storeId: "s1" } })).toContain("out_of_stock");
});

test("an open listing goes stale after a week without confirming", () => {
  expect(isStale({ availability: "available", confirmedAt: daysAgo(8) }, now)).toBe(true);
  expect(isStale({ availability: "available", confirmedAt: daysAgo(2) }, now)).toBe(false);
  expect(isStale({ availability: "sold", confirmedAt: daysAgo(30) }, now)).toBe(false);
});

test("listings are grouped in three tabs", () => {
  expect(tabOf({ availability: "reserved" })).toBe("activas");
  expect(tabOf({ availability: "sold" })).toBe("vendidas");
  expect(tabOf({ availability: "archived" })).toBe("archivadas");
});
