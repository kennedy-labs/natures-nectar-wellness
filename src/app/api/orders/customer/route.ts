import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
import { getCustomerOrdersByRefs } from "@/server/services/order.service";

export async function POST(req: Request) {
  try {
    enforceRateLimit(req, {
      keyPrefix: "orders-customer",
      limit: 30,
      windowMs: 10 * 60_000,
      message: "Too many order refresh requests. Please wait a moment and retry.",
    });

    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const orders = await getCustomerOrdersByRefs(body);
    return apiOk(orders);
  } catch (error) {
    return apiFail(error);
  }
}
