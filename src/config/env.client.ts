export function getWhatsAppNumber() {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? null;
}

export function getWhatsAppUrl(message: string) {
  const phone = getWhatsAppNumber();

  if (!phone) {
    return null;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
