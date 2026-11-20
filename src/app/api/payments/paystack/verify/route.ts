import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { verifyPaystackTransaction } from "@/server/services/payment-gateway.service";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const result = await verifyPaystackTransaction(body);
    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}
