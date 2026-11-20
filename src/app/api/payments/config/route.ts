import { apiFail, apiOk } from "@/server/http/api-response";
import { getPaymentGatewayAvailability } from "@/server/services/payment-gateway.service";

export async function GET() {
  try {
    return apiOk(getPaymentGatewayAvailability());
  } catch (error) {
    return apiFail(error);
  }
}
