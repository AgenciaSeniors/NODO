"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";

export type PickedPhoto = { file: File; url: string };

/** Up to `max` photos with previews. Files stay on the device until upload exists. */
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
  const latest = useRef(photos);
  useEffect(() => {
    latest.current = photos;
  }, [photos]);
  // Release preview URLs when the picker goes away.
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function add(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = max - photos.length;
    setError(images.length > room ? `Puedes subir hasta ${max} fotos.` : undefined);
    onChange([...photos, ...images.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  function remove(index: number) {
    URL.revokeObjectURL(photos[index].url);
    onChange(photos.filter((_, i) => i !== index));
  }

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
        {photos.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-line bg-white text-[10px] leading-tight font-medium text-muted"
          >
            <Camera aria-hidden className="size-5" />
            Agregar
          </button>
        ) : null}
        {Array.from({ length: Math.max(0, max - photos.length - 1) }).map((_, i) => (
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
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-sm font-medium text-danger-600">{error}</p> : null}
    </div>
  );
}
