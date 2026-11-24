import { NextResponse } from "next/server";

import { db } from "@/server/db/prisma";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/x-icon",
]);

function decodeDataImage(dataUri: string): {
  mimeType: string;
  body: Buffer;
} | null {
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return null;

  const header = dataUri.slice(5, commaIndex);
  const payload = dataUri.slice(commaIndex + 1);
  const isBase64 = header.endsWith(";base64");
  const rawMime = (isBase64 ? header.slice(0, -7) : header)
    .split(";")[0]
    ?.trim()
    .toLowerCase();

  if (!rawMime || !ALLOWED_IMAGE_MIME_TYPES.has(rawMime)) {
    return null;
  }

  const mimeType = rawMime === "image/jpg" ? "image/jpeg" : rawMime;
  const body = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return { mimeType, body };
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/media/[kind]/[id]">
) {
  const { kind, id } = await context.params;

  if (kind !== "products" && kind !== "categories") {
    return new Response("Not found", { status: 404 });
  }

  const record =
    kind === "products"
      ? await db.product.findUnique({
          where: { id },
          select: { image: true, updatedAt: true },
        })
      : await db.category.findUnique({
          where: { id },
          select: { image: true, updatedAt: true },
        });

  if (!record?.image) {
    return new Response("Not found", { status: 404 });
  }

  if (!record.image.startsWith("data:")) {
    return NextResponse.redirect(new URL(record.image, request.url), 307);
  }

  const decoded = decodeDataImage(record.image);
  if (!decoded) {
    return new Response("Unsupported media", { status: 415 });
  }

  const etag = `"${kind}-${id}-${record.updatedAt.getTime()}"`;
  const hasVersion = new URL(request.url).searchParams.has("v");
  const cacheControl = hasVersion
    ? "public, max-age=31536000, immutable"
    : "public, max-age=3600, stale-while-revalidate=86400";

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": cacheControl,
      },
    });
  }

  return new Response(new Uint8Array(decoded.body), {
    status: 200,
    headers: {
      "Content-Type": decoded.mimeType,
      "Content-Length": String(decoded.body.byteLength),
      "Cache-Control": cacheControl,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
