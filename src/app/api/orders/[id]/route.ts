import { requireAdminRequest } from "@/server/auth/admin-auth";
import { confirmDeliveryQuote, updateOrderStatus } from "@/server/services/order.service";
import { ApiError } from "@/server/http/api-error";

export async function PATCH(req: Request) {
  try {
    await requireAdminRequest(req);

    const body = await req.json().catch(() => null);
    const url = new URL(req.url);
    const orderId = url.pathname.split("/").at(-1);

    if (!orderId) {
      throw new ApiError(400, "INVALID_ORDER_ID", "Order ID is missing.");
    }

    // Handle delivery quote confirmation
    if (body && typeof body.fee === 'number') {
      const updated = await confirmDeliveryQuote(orderId, body.fee, body.notes || "");
      return Response.json(updated);
    }

    // Handle status update
    if (body?.status) {
      const updated = await updateOrderStatus(orderId, body.status);
      return Response.json(updated);
    }

    throw new ApiError(400, "INVALID_REQUEST", "Either fee or status is required.");

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