import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { releaseUnpaidMpesaHold } from "@/server/services/order.service";

export async function POST(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "orders-release-unpaid",
      limit: 20,
      windowMs: 5 * 60_000,
      message: "Too many checkout reset requests. Please try again shortly.",
    });

    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const result = await releaseUnpaidMpesaHold(body);
    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}
