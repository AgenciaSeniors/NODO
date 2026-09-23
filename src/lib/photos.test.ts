import { expect, test } from "vitest";
import { sniffImageType } from "./image-type";
import { isSafePhotoPath, photoUrl, thumbPath } from "./photos";

const user = "3f0c8d9e-1b2a-4c5d-8e7f-0a1b2c3d4e5f";

test("thumbnails sit next to the photo", () => {
  expect(thumbPath(`${user}/p/0-abc.webp`)).toBe(`${user}/p/0-abc-mini.webp`);
});

test("photo URLs stay on our domain", () => {
  expect(photoUrl("product-images", `${user}/p/0 a.webp`)).toBe(`/fotos/product-images/${user}/p/0%20a.webp`);
});

test("only paths the app creates are proxied", () => {
  expect(isSafePhotoPath(`${user}/${user}/0-k3j2.webp`)).toBe(true);
  expect(isSafePhotoPath(`${user}/${user}/0-k3j2-mini.jpg`)).toBe(true);
  expect(isSafePhotoPath(`${user}/../secret.webp`)).toBe(false);
  expect(isSafePhotoPath(`${user}/x.svg`)).toBe(false);
  expect(isSafePhotoPath("x/y.webp")).toBe(false);
});

test("images are recognized by their bytes, not their name", () => {
  const bytes = (...values: Array<number | string>) =>
    new Uint8Array(values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));
  expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
  expect(sniffImageType(bytes(0x89, "PNG", 0x0d, 0x0a))).toBe("image/png");
  expect(sniffImageType(bytes("RIFF", 0, 0, 0, 0, "WEBP"))).toBe("image/webp");
  expect(sniffImageType(bytes("<svg onload=alert(1)>"))).toBeNull();
});
