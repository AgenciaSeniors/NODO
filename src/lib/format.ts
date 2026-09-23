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

// Example reference rates, only used to sort mixed-currency results by price.
// Before launch these must come from a live source (e.g. the informal market
// rate published daily) instead of constants.
const CUP_PER_UNIT: Record<Currency, number> = { CUP: 1, USD: 400, EUR: 430, MLC: 250 };

export function toCupEstimate(amount: number, currency: Currency): number {
  return amount * CUP_PER_UNIT[currency];
}
