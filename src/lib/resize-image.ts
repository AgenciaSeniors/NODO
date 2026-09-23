// Browser-only: shrinks photos before they leave the phone. A 4 MB camera
// photo becomes ~150 KB, which matters on Cuban mobile data.

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** WebP where the browser can encode it (Safari can't), JPEG otherwise. */
async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("could not encode image");
  return jpeg;
}

function draw(img: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  // Transparent PNGs would turn black as JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** One photo, resized so its longest side is at most `maxSide` pixels. */
export async function resizeImage(file: Blob, maxSide: number, quality = 0.8): Promise<Blob> {
  return encode(draw(await loadImage(file), maxSide), quality);
}

/** Product photos: a full version for the gallery and a small one for cards. */
export async function preparePhoto(file: Blob): Promise<{ full: Blob; thumb: Blob }> {
  const img = await loadImage(file);
  const [full, thumb] = await Promise.all([encode(draw(img, 1280), 0.8), encode(draw(img, 420), 0.72)]);
  return { full, thumb };
}

export function extensionOf(blob: Blob): string {
  return blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
}
