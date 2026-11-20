import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { trackCustomerOrder } from "@/server/services/order.service";

export async function POST(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "orders-track",
      limit: 20,
      windowMs: 10 * 60_000,
      message: "Too many tracking requests. Please wait a few minutes and try again.",
    });

    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const tracked = await trackCustomerOrder(body);
    return apiOk(tracked);
  } catch (error) {
    return apiFail(error);
  }
}
