import type { Currency } from "@/lib/types";

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export function formatPrice(amount: number, currency: Currency): string {
  return `${number.format(amount)} ${currency}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${number.format(Math.round(km * 10) / 10)} km`;
}

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "hace 45 minutos", "hace 3 horas", "ayer"… */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const minutes = Math.round((date.getTime() - now.getTime()) / 60_000);
  if (Math.abs(minutes) < 1) return "ahora mismo";
  if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, "hour");
  return relative.format(Math.round(hours / 24), "day");
}

// Cuba has no single real exchange rate (the street rate varies by who you
// ask), so NODO doesn't impose one: a seller may say how they personally
// value a foreign currency on their own listing (Product.exchangeRate).
// These are only the fallback, used to sort mixed-currency results by price
// when a seller left theirs blank — a rough reference, not an official rate.
const FALLBACK_CUP_PER_UNIT: Record<Currency, number> = { CUP: 1, USD: 770, EUR: 870, MLC: 480 };

export function toCupEstimate(amount: number, currency: Currency, ownRate?: number): number {
  if (currency === "CUP") return amount;
  return amount * (ownRate ?? FALLBACK_CUP_PER_UNIT[currency]);
}

/** "Mercado El Sol" → "ME", "yanet" → "Y". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /\p{L}|\d/u.test(w.charAt(0)))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** "Carlos Martínez Pérez" → "Carlos M.": people show a short name in public. */
export function shortName(fullName: string): string {
  const [first, second] = fullName.trim().split(/\s+/);
  if (!first) return "";
  return second ? `${first} ${second.charAt(0).toUpperCase()}.` : first;
}
