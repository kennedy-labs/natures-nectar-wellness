import { getWhatsAppUrl } from "@/config/env.client";

export function createProductInquiryMessage(name: string) {
  return `Hello Nature's Nectar Wellness, I would like to ask about: ${name}`;
}

export function getProductInquiryUrl(name: string) {
  const message = createProductInquiryMessage(name);

  return getWhatsAppUrl(message);
}

