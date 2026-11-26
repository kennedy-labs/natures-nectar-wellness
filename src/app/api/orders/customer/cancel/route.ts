import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { cancelCustomerOrder } from "@/server/services/order.service";

export async function POST(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "orders-customer-cancel",
      limit: 15,
      windowMs: 10 * 60_000,
      message:
        "Too many cancellation requests. Please wait a moment and try again.",
    });

    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const cancelledOrder = await cancelCustomerOrder(body);
    return apiOk(cancelledOrder);
  } catch (error) {
    return apiFail(error);
  }
}
