import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/config/env.client";

export function FloatingWhatsAppButton() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I would like help placing an order."
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#168A47] text-white shadow-[0_8px_24px_rgba(22,138,71,0.38)] transition-all duration-200 hover:scale-105 hover:bg-[#12743B] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168A47] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6 shrink-0" />
    </a>
  );
}
