import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiFail, apiOk } from "@/server/http/api-response";
import { expireStaleUnpaidOrders } from "@/server/services/order.service";

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);

    const result = await expireStaleUnpaidOrders(24);
    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}
