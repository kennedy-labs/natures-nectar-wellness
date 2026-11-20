import { NextResponse } from "next/server";

import { apiFail } from "@/server/http/api-response";
import { handlePaystackWebhook } from "@/server/services/payment-gateway.service";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const result = await handlePaystackWebhook(rawBody, signature);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiFail(error);
  }
}
