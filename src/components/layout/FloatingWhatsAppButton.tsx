"use client";

import { MessageCircle } from "lucide-react";

import { useWhatsAppContext } from "@/components/layout/WhatsAppContext";
import { getWhatsAppUrl } from "@/config/env.client";
import { DEFAULT_STOREFRONT_WHATSAPP_MESSAGE } from "@/features/whatsapp/utils/whatsapp.utils";

export function FloatingWhatsAppButton() {
  const { contextMessage } = useWhatsAppContext();
  const activeMessage = contextMessage?.trim() || DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  const whatsappUrl = getWhatsAppUrl(activeMessage);

  if (!whatsappUrl) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      rel="noopener noreferrer"
      target="_blank"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_28px_-6px_rgba(24,42,32,0.38)] transition-transform duration-150 hover:scale-[1.04] hover:bg-primary/95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-11 sm:w-auto sm:gap-2 sm:px-4"
    >
      <MessageCircle className="h-5 w-5 shrink-0" />
      <span className="hidden text-sm font-medium sm:inline">WhatsApp</span>
    </a>
  );
}
