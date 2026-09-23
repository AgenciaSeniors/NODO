import type { Availability, Currency, DeliveryMethod, PaymentMethod } from "@/lib/types";

/** tint/ink color the placeholder shown while a product has no photo. */
export type Category = { id: string; label: string; icon: string; tint: string; ink: string };

export const CATEGORIES: Category[] = [
  { id: "alimentos", label: "Alimentos", icon: "ShoppingBasket", tint: "#FFF1C7", ink: "#B86A00" },
  { id: "tecnologia", label: "Tecnología", icon: "Laptop", tint: "#DCE8FB", ink: "#1565C0" },
  { id: "hogar", label: "Hogar", icon: "House", tint: "#D7EEEE", ink: "#23706F" },
  { id: "ropa", label: "Ropa", icon: "Shirt", tint: "#FBD3DD", ink: "#B0224F" },
  { id: "salud", label: "Salud y belleza", icon: "HeartPulse", tint: "#DDF3E4", ink: "#1E843A" },
  { id: "vehiculos", label: "Vehículos", icon: "Car", tint: "#E5E7EB", ink: "#374151" },
  { id: "construccion", label: "Construcción", icon: "Hammer", tint: "#EDE3D6", ink: "#7B3F1D" },
  { id: "otros", label: "Otros", icon: "Package", tint: "#EFEAE0", ink: "#5B625D" },
];

export function findCategory(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id);
}

export const CURRENCIES: Currency[] = ["CUP", "USD", "EUR", "MLC"];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
};

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: "Recogida",
  delivery: "Domicilio",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "Disponible",
  low_stock: "Pocas unidades",
  out_of_stock: "Agotado",
  reserved: "Reservado",
  sold: "Vendido",
  hidden: "Oculto",
  archived: "Archivado",
  draft: "Borrador",
};
