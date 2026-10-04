import { expect, test } from "vitest";
import { parseFollows, serializeFollows, toggleFollow } from "./store-follows";

test("round trip", () => {
  expect(parseFollows(serializeFollows(["s1", "s7"]))).toEqual(["s1", "s7"]);
});

test("ignores junk and duplicates", () => {
  expect(parseFollows("s1.s1.<script>.s2")).toEqual(["s1", "s2"]);
  expect(parseFollows(undefined)).toEqual([]);
});

test("toggle adds and removes", () => {
  expect(toggleFollow(["s1"], "s2")).toEqual(["s1", "s2"]);
  expect(toggleFollow(["s1", "s2"], "s1")).toEqual(["s2"]);
});

test("keeps the most recent 60", () => {
  const ids = Array.from({ length: 120 }, (_, i) => `s${i}`);
  const kept = parseFollows(serializeFollows(ids));
  expect(kept).toHaveLength(60);
  expect(kept.at(-1)).toBe("s119");
});
