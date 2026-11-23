import type { SubmitOrderInput } from "@/features/orders/validations/order.validation";

export function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `NNW-${timestamp}-${suffix}`;
}

export function buildGoogleMapsPinUrl(
  latitude?: number | null,
  longitude?: number | null
): string | null {
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

const GPS_PIN_TAG_REGEX =
  /\[GPS Pin:\s*(https:\/\/maps\.google\.com\/\?q=[^\]]+)\]/i;

export function appendGpsPinToNotes(
  notes: string | undefined,
  mapUrl: string | null
): string | undefined {
  const trimmed = notes?.trim();
  if (!mapUrl) {
    return trimmed || undefined;
  }
  const tag = `[GPS Pin: ${mapUrl}]`;
  return trimmed ? `${trimmed}\n${tag}` : tag;
}

export function parseDeliveryNotesPin(deliveryNotes?: string | null): {
  cleanNotes: string | null;
  mapUrl: string | null;
} {
  if (!deliveryNotes) {
    return { cleanNotes: null, mapUrl: null };
  }

  const match = deliveryNotes.match(GPS_PIN_TAG_REGEX);
  const mapUrl = match?.[1]?.trim() ?? null;
  const cleanNotes = deliveryNotes
    .replace(GPS_PIN_TAG_REGEX, "")
    .trim();

  return {
    cleanNotes: cleanNotes || null,
    mapUrl,
  };
}

type WhatsappOrderItem = {
  name: string;
  quantity: number;
  lineTotal: number;
};

export function createWhatsappOrderMessage({
  orderNumber,
  customer,
  delivery,
  items,
  subtotalAmount,
}: {
  orderNumber: string;
  customer: SubmitOrderInput["customer"];
  delivery: SubmitOrderInput["delivery"];
  items: WhatsappOrderItem[];
  subtotalAmount: number;
}) {
  const itemLines = items
    .map((item) => `- ${item.name} x${item.quantity}: KES ${item.lineTotal}`)
    .join("\n");
  const mapUrl = buildGoogleMapsPinUrl(delivery.latitude, delivery.longitude);

  return [
    `New order request: ${orderNumber}`,
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery: ${delivery.method}`,
    delivery.location ? `Location: ${delivery.location}` : null,
    mapUrl ? `Map Pin: ${mapUrl}` : null,
    delivery.notes ? `Notes: ${delivery.notes}` : null,
    "Items:",
    itemLines,
    `Subtotal: KES ${subtotalAmount}`,
    "Delivery fee: to be confirmed",
  ]
    .filter(Boolean)
    .join("\n");
}
