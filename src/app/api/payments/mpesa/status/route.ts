import { ApiError } from "@/server/http/api-error";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import { queryOrderPaymentStatus } from "@/server/services/payment-gateway.service";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is required.");
    }

    const status = await queryOrderPaymentStatus(body);
    return apiOk(status);
  } catch (error) {
    return apiFail(error);
  }
}
