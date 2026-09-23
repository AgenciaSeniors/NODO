import { expect, test } from "vitest";
import { siteUrl } from "./site";

test("explicit URL wins", () => {
  expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://nodo.cu", VERCEL_URL: "x.vercel.app" }).origin).toBe("https://nodo.cu");
});

test("Vercel production uses the production domain", () => {
  expect(
    siteUrl({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "nodo.vercel.app", VERCEL_URL: "nodo-abc.vercel.app" }).origin,
  ).toBe("https://nodo.vercel.app");
});

test("Vercel previews use their own URL", () => {
  expect(siteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "nodo-git-rama.vercel.app" }).origin).toBe("https://nodo-git-rama.vercel.app");
});

test("local fallback", () => {
  expect(siteUrl({}).origin).toBe("http://localhost:3000");
});
