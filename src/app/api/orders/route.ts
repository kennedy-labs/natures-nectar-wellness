import { requireAdminRequest } from "@/server/auth/admin-auth";
import {
  apiCreated,
  apiFail,
  apiOk,
  readJson,
} from "@/server/http/api-response";
import {
  getOrdersForAdmin,
  submitOrder,
} from "@/server/services/order.service";
import { ApiError } from "@/server/http/api-error";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);

    const orders = await getOrdersForAdmin();

    return apiOk(orders);
  } catch (error) {
    return apiFail(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJson(req);

    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is missing.");
    }

    const order = await submitOrder(body);

    return apiCreated(order);
  } catch (error) {
    return apiFail(error);
  }
}