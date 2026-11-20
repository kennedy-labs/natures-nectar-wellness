import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { initializePaystackPayment } from "@/server/services/payment-gateway.service";

export async function POST(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "paystack-init",
      limit: 10,
      windowMs: 5 * 60_000,
      message: "Too many payment attempts. Please wait a few minutes and try again.",
    });

    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const result = await initializePaystackPayment(body);
    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}
