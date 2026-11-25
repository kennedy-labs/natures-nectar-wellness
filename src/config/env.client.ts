const DEFAULT_WHATSAPP_NUMBER = "254757122299";

export function getWhatsAppNumber(): string {
  const digits = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return DEFAULT_WHATSAPP_NUMBER;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export function getWhatsAppUrl(message: string) {
  const phone = getWhatsAppNumber();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
