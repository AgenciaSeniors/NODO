// Photos live in public Supabase Storage buckets but are always served from
// our own domain (/fotos/...), so phones never need to reach supabase.co and
// the CDN keeps a copy close to the user.

export const PHOTO_BUCKETS = ["product-images", "store-logos"] as const;
export type PhotoBucket = (typeof PHOTO_BUCKETS)[number];

/** Each product photo is uploaded twice: full size and a small card thumbnail. */
export function thumbPath(path: string): string {
  return path.replace(/(\.[a-z0-9]+)?$/i, (ext) => `-mini${ext}`);
}

export function photoUrl(bucket: PhotoBucket, path: string): string {
  return `/fotos/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Paths we create look like "<uuid>/<uuid>/0-k3j2.webp"; nothing else is proxied. */
export function isSafePhotoPath(path: string): boolean {
  return /^[0-9a-f-]{36}(\/[A-Za-z0-9_-]+)+\.(webp|jpg|png)$/.test(path) && !path.includes("..");
}
