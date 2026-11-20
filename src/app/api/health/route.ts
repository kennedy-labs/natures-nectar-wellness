import { NextResponse } from "next/server";

import { db } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        data: {
          status: "healthy",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UNHEALTHY",
          message: "Database connectivity check failed.",
        },
      },
      { status: 503 }
    );
  }
}
