/** wa.me link that opens a chat with a ready-to-send message. */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function productInquiry(productTitle: string): string {
  return `Hola, vi tu publicación de ${productTitle} en NODO. ¿Sigue disponible?`;
}
