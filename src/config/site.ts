export const SITE_NAME = "Nature's Nectar Wellness";
export const SITE_TITLE =
  "Nature's Nectar Wellness – Herbal Supplements & Teas in Kenya";
export const SITE_DESCRIPTION =
  "Shop herbal supplements, raw forest honey, mineral resins, and natural wellness teas delivered across Kenya.";
export const DEFAULT_OG_IMAGE = "/images/mau-forest-honey.jpg";

export const BUSINESS_LOCATION = {
  shopName: "Nature's Nectar Wellness",
  streetAddress: "Kooni Mall, Shop Number B4, Tsavo Street",
  city: "Nairobi",
  country: "Kenya",
  fullAddress: "Kooni Mall, Shop Number B4, Tsavo Street, Nairobi",
  phoneDisplay: "+254 721 3320 97",
  phoneDigits: "254721332097",
  phoneHref: "tel:+254721332097",
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Kooni+Mall%2C+Tsavo+Street%2C+Nairobi",
  googleMapsEmbedUrl:
    "https://maps.google.com/maps?q=kooni%20mall%20tsavo%20street%20nairobi&t=m&z=16&output=embed&iwloc=near",
} as const;

function normalizeOrigin(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getSiteUrl(): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.BETTER_AUTH_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.APP_URL) ??
    "http://localhost:3000"
  );
}

export function getMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function getAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
