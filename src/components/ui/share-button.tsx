"use client";

import { useState } from "react";
import { Share } from "lucide-react";

/** Native share sheet (WhatsApp, Telegram…) where available; otherwise copies the link. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // The user closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  return (
    <>
      <button type="button" onClick={share} aria-label="Compartir" className="flex size-11 shrink-0 items-center justify-center rounded-full">
        <Share aria-hidden className="size-6" />
      </button>
      <p
        role="status"
        className={
          copied
            ? "fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg"
            : "sr-only"
        }
      >
        {copied ? "Enlace copiado" : ""}
      </p>
    </>
  );
}
