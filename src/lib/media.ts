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
