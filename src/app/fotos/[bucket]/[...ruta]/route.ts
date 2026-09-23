import { isSafePhotoPath, PHOTO_BUCKETS, type PhotoBucket } from "@/lib/photos";
import { storageUrl } from "@/lib/supabase/config";

// Serves photos from Supabase Storage through our own domain. Paths are
// unique and never overwritten, so the CDN and phones may keep them forever.
export async function GET(_request: Request, { params }: RouteContext<"/fotos/[bucket]/[...ruta]">) {
  const { bucket, ruta } = await params;
  const path = ruta.join("/");
  if (!PHOTO_BUCKETS.includes(bucket as PhotoBucket) || !isSafePhotoPath(path)) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = await fetch(storageUrl(bucket, path), { cache: "no-store" }).catch(() => null);
  const type = upstream?.headers.get("content-type") ?? "";
  if (!upstream?.ok || !upstream.body || !type.startsWith("image/")) {
    // Storage answers a missing file with 400 or 404; only its own failures are 502.
    const unavailable = !upstream || upstream.status >= 500;
    return new Response(unavailable ? "Unavailable" : "Not found", { status: unavailable ? 502 : 404 });
  }
  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      // s-maxage lets the Vercel CDN keep it too, not just the phone.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
