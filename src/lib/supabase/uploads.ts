import "server-only";
import { IMAGE_EXTENSIONS, sniffImageType, type ImageType } from "@/lib/image-type";
import { thumbPath, type PhotoBucket } from "@/lib/photos";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;
export type ImageFile = { bytes: Uint8Array; type: ImageType };

/** An uploaded photo, checked by its real content and size. Null when none was sent. */
export async function readImage(value: FormDataEntryValue | null, maxBytes: number): Promise<ImageFile | null | "invalid"> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > maxBytes) return "invalid";
  const bytes = new Uint8Array(await value.arrayBuffer());
  const type = sniffImageType(bytes);
  return type ? { bytes, type } : "invalid";
}

export type PhotoPair = { full: ImageFile; thumb: ImageFile };

/** Product photos arrive as "fotos" (full size) and "miniaturas" (same order). */
export async function readPhotoPairs(data: FormData, max: number): Promise<PhotoPair[] | "invalid"> {
  const full = data.getAll("fotos");
  const thumbs = data.getAll("miniaturas");
  if (full.length > max || full.length !== thumbs.length) return "invalid";
  const pairs: PhotoPair[] = [];
  for (let i = 0; i < full.length; i++) {
    const [f, t] = await Promise.all([readImage(full[i], 1_500_000), readImage(thumbs[i], 300_000)]);
    if (!f || !t || f === "invalid" || t === "invalid" || f.type !== t.type) return "invalid";
    pairs.push({ full: f, thumb: t });
  }
  return pairs;
}

export function randomToken(length = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => alphabet[b % alphabet.length]).join("");
}

async function put(supabase: Client, bucket: PhotoBucket, path: string, image: ImageFile): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, image.bytes, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (error) console.error(`[supabase] upload to ${bucket}: ${error.message}`);
  return !error;
}

/** Stores one image; returns its path inside the bucket, or null if the upload failed. */
export async function uploadImage(supabase: Client, bucket: PhotoBucket, base: string, image: ImageFile): Promise<string | null> {
  const path = `${base}.${IMAGE_EXTENSIONS[image.type]}`;
  return (await put(supabase, bucket, path, image)) ? path : null;
}

/** Stores a photo and its thumbnail next to it ("…-mini.webp"). */
export async function uploadPhotoPair(supabase: Client, base: string, pair: PhotoPair): Promise<string | null> {
  const path = `${base}.${IMAGE_EXTENSIONS[pair.full.type]}`;
  const [full, thumb] = await Promise.all([
    put(supabase, "product-images", path, pair.full),
    put(supabase, "product-images", thumbPath(path), pair.thumb),
  ]);
  return full && thumb ? path : null;
}
