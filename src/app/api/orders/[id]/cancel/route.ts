import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiFail, apiOk } from "@/server/http/api-response";
import { cancelOrder } from "@/server/services/order.service";

export async function POST(
  req: Request,
  context: RouteContext<"/api/orders/[id]/cancel">
) {
  try {
    await requireAdminRequest(req);

    const { id } = await context.params;
    const cancelled = await cancelOrder(id);

    return apiOk(cancelled);
  } catch (error) {
    return apiFail(error);
  }
}
