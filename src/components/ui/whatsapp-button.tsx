import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/whatsapp";

const look = "flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-semibold";

export function WhatsAppButton({
  phone,
  message,
  label = "Contactar por WhatsApp",
  example = false,
  className,
}: {
  phone: string;
  message: string;
  label?: string;
  /** Example content has no real seller behind it: nothing to contact. */
  example?: boolean;
  className?: string;
}) {
  if (example) {
    return (
      <span aria-disabled="true" className={cn(look, "bg-sand text-muted", className)}>
        <MessageCircle aria-hidden className="size-5" />
        Es un ejemplo
      </span>
    );
  }
  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(look, "bg-brand-600 text-white shadow-sm", className)}
    >
      <MessageCircle aria-hidden className="size-5" />
      {label}
    </a>
  );
}
