import { expect, test } from "vitest";
import { formatDistance, formatPrice, initials, shortName, timeAgo } from "./format";
import { whatsappLink, productInquiry } from "./whatsapp";

test("prices keep their currency", () => {
  expect(formatPrice(650, "CUP")).toBe("650 CUP");
  expect(formatPrice(12000, "CUP")).toBe("12.000 CUP");
  expect(formatPrice(18.5, "USD")).toBe("18,5 USD");
});

test("distances", () => {
  expect(formatDistance(0.9)).toBe("900 m");
  expect(formatDistance(1.24)).toBe("1,2 km");
});

test("relative time in Spanish", () => {
  const now = new Date("2026-09-23T12:00:00Z");
  expect(timeAgo(new Date("2026-09-23T11:15:00Z"), now)).toBe("hace 45 minutos");
  expect(timeAgo(new Date("2026-09-23T09:00:00Z"), now)).toBe("hace 3 horas");
});

test("WhatsApp link strips formatting and encodes the message", () => {
  const link = whatsappLink("+53 5 245 6789", productInquiry("Aceite 1 L"));
  expect(link.startsWith("https://wa.me/5352456789?text=")).toBe(true);
  expect(decodeURIComponent(link.split("text=")[1])).toBe(
    "Hola, vi tu publicación de Aceite 1 L en NODO. ¿Sigue disponible?",
  );
});

test("initials and public short names", () => {
  expect(initials("Mercado El Sol")).toBe("ME");
  expect(initials("  yanet ")).toBe("Y");
  expect(initials("¡Oferta! 24h")).toBe("2");
  expect(shortName("Carlos Martínez Pérez")).toBe("Carlos M.");
  expect(shortName("Yanet")).toBe("Yanet");
  expect(shortName("   ")).toBe("");
});
