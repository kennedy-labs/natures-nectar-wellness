import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";

type NominatimAddress = {
  road?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
};

type NominatimResponse = {
  display_name?: string;
  address?: NominatimAddress;
};

const locationCache = new Map<string, { label: string | null; timestamp: number }>();

function formatReadableLocation(data: NominatimResponse): string | null {
  const addr = data.address;
  if (addr) {
    const parts = [
      addr.road,
      addr.neighbourhood ?? addr.quarter ?? addr.residential ?? addr.suburb,
      addr.city ?? addr.town ?? addr.village ?? addr.county,
    ]
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part));

    const uniqueParts = Array.from(new Set(parts));
    if (uniqueParts.length > 0) {
      return uniqueParts.join(", ");
    }
  }

  if (data.display_name) {
    const segments = data.display_name
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (segments.length > 0) {
      return segments.join(", ");
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "reverse-geocode",
      limit: 20,
      windowMs: 60_000,
      message: "Too many location lookups. Please wait a moment and try again.",
    });

    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ApiError(400, "INVALID_COORDINATES", "Valid latitude and longitude are required.");
    }

    const formattedLat = lat.toFixed(6);
    const formattedLng = lng.toFixed(6);
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const mapUrl = `https://maps.google.com/?q=${formattedLat},${formattedLng}`;

    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600_000) {
      return apiOk({
        label: cached.label,
        mapUrl,
        latitude: Number(formattedLat),
        longitude: Number(formattedLng),
      });
    }

    let label: string | null = null;

    try {
      const upstreamUrl = new URL("https://nominatim.openstreetmap.org/reverse");
      upstreamUrl.searchParams.set("format", "jsonv2");
      upstreamUrl.searchParams.set("lat", formattedLat);
      upstreamUrl.searchParams.set("lon", formattedLng);
      upstreamUrl.searchParams.set("zoom", "18");
      upstreamUrl.searchParams.set("addressdetails", "1");

      const upstreamRes = await fetch(upstreamUrl.toString(), {
        headers: {
          "User-Agent":
            "NaturesNectarWellness/1.0 (https://natures-nectar-wellness.vercel.app)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(4000),
      });

      if (upstreamRes.ok) {
        const json = (await upstreamRes.json()) as NominatimResponse;
        label = formatReadableLocation(json);
        locationCache.set(cacheKey, { label, timestamp: Date.now() });
      }
    } catch {
      // Graceful fallback: return mapUrl even if reverse geocoder times out
    }

    return apiOk({
      label,
      mapUrl,
      latitude: Number(formattedLat),
      longitude: Number(formattedLng),
    });
  } catch (error) {
    return apiFail(error);
  }
}
