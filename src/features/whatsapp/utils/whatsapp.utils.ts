import { getWhatsAppUrl } from "@/config/env.client";

export const DEFAULT_STOREFRONT_WHATSAPP_MESSAGE =
  "Hello Nature's Nectar Wellness, I have a question about your products.";

export function sanitizeWhatsappField(
  value: string | null | undefined,
  maxLength = 80
): string {
  if (!value) return "";

  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, Math.max(1, maxLength - 3)).trim()}...`;
}

export function createCategoryInquiryMessage(categoryName: string): string {
  const safeName = sanitizeWhatsappField(categoryName, 60);
  if (!safeName) return DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  return `Hi, I'm browsing ${safeName} and have a quick question.`;
}

export function createProductInquiryMessage(productName: string): string {
  const safeName = sanitizeWhatsappField(productName, 80);
  if (!safeName) return DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  return `Hi, I'd like to ask about ${safeName}.`;
}

export function getProductInquiryUrl(name: string) {
  return getWhatsAppUrl(createProductInquiryMessage(name));
}

export function createCheckoutHelpMessage(): string {
  return "Hi, I need quick help at checkout.";
}

export function createOrdersPageHelpMessage(): string {
  return "Hi, I'm checking on an order.";
}

export function createTopicInquiryMessage(topic: string): string {
  const safeTopic = sanitizeWhatsappField(topic, 50);
  if (!safeTopic) return DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  return `Hi, I have a question about ${safeTopic}.`;
}

export function createMpesaPendingMessage({
  orderNumber,
  customerName,
}: {
  orderNumber: string;
  customerName?: string | null;
}): string {
  const safeOrder = sanitizeWhatsappField(orderNumber, 40);
  const safeName = sanitizeWhatsappField(customerName, 50);

  if (safeOrder && safeName) {
    return `Order ${safeOrder} (${safeName}) — waiting on M-Pesa payment.`;
  }
  if (safeOrder) {
    return `Order ${safeOrder} — waiting on M-Pesa payment.`;
  }
  return "Hi, I'm waiting on my M-Pesa payment prompt.";
}

export function formatWhatsappPaymentStatus({
  paymentStatus,
  preferredPaymentMethod,
  isPaid = false,
}: {
  paymentStatus?: string | null;
  preferredPaymentMethod?: string | null;
  isPaid?: boolean;
}): string {
  if (isPaid || paymentStatus === "VERIFIED") {
    return preferredPaymentMethod === "CASH_ON_PICKUP"
      ? "Paid (Cash on Pickup)"
      : "Paid via M-Pesa";
  }

  if (paymentStatus === "FAILED") {
    return "Payment Failed";
  }

  if (paymentStatus === "REFUNDED") {
    return "Refunded";
  }

  if (preferredPaymentMethod === "CASH_ON_PICKUP") {
    return "Cash on Pickup";
  }

  if (preferredPaymentMethod === "MPESA_BUY_GOODS") {
    return "Awaiting M-Pesa";
  }

  if (preferredPaymentMethod === "BANK_TRANSFER") {
    return "Bank Transfer Pending";
  }

  return "Pending";
}

function formatDeliveryLabelForWhatsapp(method?: string | null): string {
  if (method === "PICKUP") return "Pickup";
  if (method === "LOCAL_DELIVERY") return "Within Nairobi";
  if (method === "COUNTRYWIDE_DELIVERY") return "Outside Nairobi";
  return sanitizeWhatsappField(method, 30);
}

export function createMinimalOrderWhatsappMessage({
  orderNumber,
  customerName,
  deliveryMethod,
  deliveryLocation,
  paymentStatus,
  preferredPaymentMethod,
  isPaid = false,
}: {
  orderNumber: string;
  customerName?: string | null;
  deliveryMethod?: string | null;
  deliveryLocation?: string | null;
  paymentStatus?: string | null;
  preferredPaymentMethod?: string | null;
  isPaid?: boolean;
}): string {
  const safeOrder = sanitizeWhatsappField(orderNumber, 40);
  const safeName = sanitizeWhatsappField(customerName, 60);
  const deliveryLabel = formatDeliveryLabelForWhatsapp(deliveryMethod);
  const safeLocation =
    deliveryMethod === "PICKUP"
      ? ""
      : sanitizeWhatsappField(deliveryLocation, 80);
  const paymentLabel = formatWhatsappPaymentStatus({
    paymentStatus,
    preferredPaymentMethod,
    isPaid,
  });

  return [
    safeOrder ? `Order ${safeOrder}` : null,
    safeName || null,
    deliveryLabel || null,
    safeLocation || null,
    paymentLabel || null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function createCancelledOrderRefundWhatsappMessage({
  orderNumber,
  customerName,
}: {
  orderNumber: string;
  customerName?: string | null;
}): string {
  const safeOrder = sanitizeWhatsappField(orderNumber, 40);
  const safeName = sanitizeWhatsappField(customerName, 50);

  if (safeOrder && safeName) {
    return `Order ${safeOrder} (${safeName}) — cancelled, requesting M-Pesa refund.`;
  }
  if (safeOrder) {
    return `Order ${safeOrder} — cancelled, requesting M-Pesa refund.`;
  }
  return "Hi, I cancelled a paid order and need help with an M-Pesa refund.";
}
