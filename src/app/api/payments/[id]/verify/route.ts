import { apiFail, apiOk } from "@/server/http/api-response";
import { requireAdminRequest } from "@/server/auth/admin-auth";
import { verifyPaymentAndMarkPaid } from "@/server/services/order.service";

export async function PATCH(
  req: Request,
  context: RouteContext<"/api/payments/[id]/verify">
) {
  try {
    await requireAdminRequest(req);

    const { id: paymentId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const result = await verifyPaymentAndMarkPaid(paymentId, body);

    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}