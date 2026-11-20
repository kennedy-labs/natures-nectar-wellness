import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { auth } from "@/server/auth/auth";
import { checkRateLimit } from "@/server/http/rate-limit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(req: Request) {
  if (req.url.includes("/sign-in")) {
    const limit = checkRateLimit(req, {
      keyPrefix: "auth-signin",
      limit: 10,
      windowMs: 15 * 60_000,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: `Too many login attempts. Please wait ${limit.retryAfterSeconds} seconds and try again.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
          },
        }
      );
    }
  }

  return handler.POST(req);
}
