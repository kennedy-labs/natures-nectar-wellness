import { ApiError } from "@/server/http/api-error";

type BucketEntry = {
  timestamps: number[];
};

const buckets = new Map<string, BucketEntry>();
let lastSweep = Date.now();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function sweepExpired(now: number, maxWindowMs: number) {
  if (now - lastSweep < 60_000 && buckets.size < 500) {
    return;
  }

  lastSweep = now;
  const cutoff = now - maxWindowMs;

  for (const [key, entry] of buckets.entries()) {
    const fresh = entry.timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      entry.timestamps = fresh;
    }
  }
}

export function checkRateLimit(
  req: Request,
  options: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
  }
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const now = Date.now();
  sweepExpired(now, Math.max(options.windowMs, 15 * 60_000));

  const ip = getClientIp(req);
  const bucketKey = `${options.keyPrefix}:${ip}`;
  const cutoff = now - options.windowMs;

  const existing = buckets.get(bucketKey);
  const recent = existing
    ? existing.timestamps.filter((ts) => ts > cutoff)
    : [];

  if (recent.length >= options.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + options.windowMs - now) / 1000)
    );
    buckets.set(bucketKey, { timestamps: recent });
    return {
      allowed: false,
      retryAfterSeconds,
      remaining: 0,
    };
  }

  recent.push(now);
  buckets.set(bucketKey, { timestamps: recent });

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, options.limit - recent.length),
  };
}

export function enforceRateLimit(
  req: Request,
  options: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
    message?: string;
  }
) {
  const result = checkRateLimit(req, options);
  if (!result.allowed) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      options.message ||
        `Too many requests. Please wait ${result.retryAfterSeconds} seconds and try again.`
    );
  }
}
