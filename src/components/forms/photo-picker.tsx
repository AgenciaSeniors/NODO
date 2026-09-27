"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, LoaderCircle, X } from "lucide-react";
import { preparePhoto } from "@/lib/resize-image";

/**
 * A photo in the picker: either one just chosen (already shrunk on the phone,
 * full size plus a card thumbnail) or one already saved (`path` in storage).
 */
export type PickedPhoto = { url: string; full?: Blob; thumb?: Blob; path?: string };

const release = (p: PickedPhoto) => {
  if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
};

/** Up to `max` photos with previews. */
export function PhotoPicker({
  id,
  max,
  photos,
  onChange,
}: {
  id: string;
  max: number;
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [preparing, setPreparing] = useState(0);
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  // Release preview URLs when the picker goes away.
  useEffect(() => () => latest.current.forEach(release), []);

  async function add(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type === "");
    const room = max - photos.length;
    const chosen = images.slice(0, room);
    setError(images.length > room ? `Puedes subir hasta ${max} fotos.` : undefined);
    setPreparing(chosen.length);
    const ready: PickedPhoto[] = [];
    for (const file of chosen) {
      try {
        const { full, thumb } = await preparePhoto(file);
        ready.push({ full, thumb, url: URL.createObjectURL(full) });
      } catch {
        setError("No pudimos leer alguna foto. Prueba con otra.");
      }
    }
    setPreparing(0);
    onChange([...latest.current, ...ready].slice(0, max));
  }

  function remove(index: number) {
    release(photos[index]);
    onChange(photos.filter((_, i) => i !== index));
  }

  const full = photos.length + preparing >= max;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1.5">
        {photos.map((p, i) => (
          <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-sand">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={p.url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute top-0 right-0 flex size-7 items-center justify-center rounded-bl-lg bg-ink/70 text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
        {Array.from({ length: preparing }).map((_, i) => (
          <div key={`preparing-${i}`} className="flex aspect-square items-center justify-center rounded-lg bg-sand text-muted">
            <LoaderCircle aria-hidden className="size-5 animate-spin" />
          </div>
        ))}
        {!full ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={preparing > 0}
            className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-line bg-white text-[10px] leading-tight font-medium text-muted"
          >
            <Camera aria-hidden className="size-5" />
            Agregar
          </button>
        ) : null}
        {Array.from({ length: Math.max(0, max - photos.length - preparing - 1) }).map((_, i) => (
          <div key={i} aria-hidden className="flex aspect-square items-center justify-center rounded-lg bg-sand/70 text-muted/40">
            <ImageIcon className="size-5" />
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          void add(e.target.files);
          e.target.value = "";
        }}
      />
      {preparing > 0 ? (
        <p role="status" className="text-sm text-muted">
          Preparando fotos…
        </p>
      ) : null}
      {error ? <p className="text-sm font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
