import { requireAdminRequest } from "@/server/auth/admin-auth";
import { updateOrderStatus } from "@/server/services/order.service";
import { ApiError } from "@/server/http/api-error";

export async function PATCH(req: Request) {
  try {
    await requireAdminRequest(req);

    const body = await req.json().catch(() => null);

    if (!body?.status) {
      throw new ApiError(400, "INVALID_STATUS", "Status is required.");
    }

    const url = new URL(req.url);
    const orderId = url.pathname.split("/").at(-1);

    if (!orderId) {
      throw new ApiError(400, "INVALID_ORDER_ID", "Order ID is missing.");
    }

    const updated = await updateOrderStatus(orderId, body.status);

    return Response.json(updated);

  } catch (error) {
    const err = error as { code?: string; message?: string; statusCode?: number; status?: number };

    return Response.json(
      {
        code: err?.code || "UNKNOWN_ERROR",
        message: err?.message || "Something went wrong",
      },
      { status: err?.statusCode || err?.status || 500 }
    );
  }
}