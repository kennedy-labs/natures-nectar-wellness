import type { SubmitOrderInput } from "@/features/orders/validations/order.validation";
import { createMinimalOrderWhatsappMessage } from "@/features/whatsapp/utils/whatsapp.utils";

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

export function getDeliveryMethodLabel(method: string): string {
  if (method === "PICKUP") return "Pickup";
  if (method === "LOCAL_DELIVERY") return "Within Nairobi";
  if (method === "COUNTRYWIDE_DELIVERY") return "Outside Nairobi";
  return method;
}

export function getDeliveryFeeSummary(
  method: string,
  confirmedFee?: number | null
): string {
  if (typeof confirmedFee === "number" && Number.isFinite(confirmedFee)) {
    return confirmedFee === 0
      ? "Free"
      : `KES ${confirmedFee.toLocaleString("en-KE")}`;
  }
  if (method === "PICKUP" || method === "LOCAL_DELIVERY") {
    return "Free";
  }
  return "Admin confirms";
}

export function createWhatsappOrderMessage({
  orderNumber,
  customer,
  delivery,
  preferredPaymentMethod,
  isPaid = false,
}: {
  orderNumber: string;
  customer: Pick<SubmitOrderInput["customer"], "name">;
  delivery: Pick<SubmitOrderInput["delivery"], "method" | "location">;
  preferredPaymentMethod?: string | null;
  isPaid?: boolean;
}) {
  return createMinimalOrderWhatsappMessage({
    orderNumber,
    customerName: customer.name,
    deliveryMethod: delivery.method,
    deliveryLocation: delivery.location,
    preferredPaymentMethod,
    isPaid,
  });
}
