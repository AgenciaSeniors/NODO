import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppButton({
  phone,
  message,
  label = "Contactar por WhatsApp",
  className,
}: {
  phone: string;
  message: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 font-semibold text-white shadow-sm",
        className,
      )}
    >
      <MessageCircle aria-hidden className="size-5" />
      {label}
    </a>
  );
}
