export type MediaKind = "products" | "categories";

export function toStorefrontMediaUrl(
  kind: MediaKind,
  id: string,
  image: string | null | undefined,
  updatedAt?: Date | string | null
): string | null {
  if (!image) {
    return null;
  }

  if (!image.startsWith("data:")) {
    return image;
  }

  const timestamp = updatedAt ? new Date(updatedAt).getTime() : NaN;
  const versionSuffix = Number.isFinite(timestamp) ? `?v=${timestamp}` : "";

  return `/api/media/${kind}/${id}${versionSuffix}`;
}

export function getCategoryFallbackImage(slug?: string | null): string {
  switch (slug) {
    case "herbal-teas":
      return "/images/calm-rest-tea.jpg";
    case "herbal-blends":
      return "/images/hibiscus-tisane.jpg";
    case "supplements":
      return "/images/ashwagandha-tincture.jpg";
    case "honey-resins":
      return "/images/mau-forest-honey.jpg";
    case "topicals":
      return "/images/neem-balm.jpg";
    default:
      return "/images/mau-forest-honey.jpg";
  }
}
