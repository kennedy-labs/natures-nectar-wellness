export const SITE_NAME = "Nature's Nectar Wellness";
export const SITE_TITLE =
  "Nature's Nectar Wellness – Herbal Supplements & Teas in Kenya";
export const SITE_DESCRIPTION =
  "Shop herbal supplements, raw forest honey, mineral resins, and natural wellness teas delivered across Kenya.";
export const DEFAULT_OG_IMAGE = "/images/mau-forest-honey.jpg";

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
