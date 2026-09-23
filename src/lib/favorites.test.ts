import { expect, test } from "vitest";
import { parseFavorites, serializeFavorites, toggleFavorite } from "./favorites";

test("round trip", () => {
  expect(parseFavorites(serializeFavorites(["p1", "p7"]))).toEqual(["p1", "p7"]);
});

test("ignores junk and duplicates", () => {
  expect(parseFavorites("p1.p1.<script>.p2")).toEqual(["p1", "p2"]);
  expect(parseFavorites(undefined)).toEqual([]);
});

test("toggle adds and removes", () => {
  expect(toggleFavorite(["p1"], "p2")).toEqual(["p1", "p2"]);
  expect(toggleFavorite(["p1", "p2"], "p1")).toEqual(["p2"]);
});

test("keeps the most recent 60", () => {
  const ids = Array.from({ length: 120 }, (_, i) => `p${i}`);
  const kept = parseFavorites(serializeFavorites(ids));
  expect(kept).toHaveLength(60);
  expect(kept.at(-1)).toBe("p119");
});
