import { NextResponse } from "next/server";

import { apiFail, readJson } from "@/server/http/api-response";
import { handleMpesaCallback } from "@/server/services/payment-gateway.service";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const body = await readJson(req);

    await handleMpesaCallback(body, token);

    // Safaricom Daraja expects ResultCode 0 acknowledgement
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } catch (error) {
    return apiFail(error);
  }
}
