import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/server/auth/admin-auth";
import {
  confirmDeliveryQuote,
  updateOrderStatus,
} from "@/server/services/order.service";
import { ApiError, getApiErrorResponse } from "@/server/http/api-error";

export async function PATCH(
  req: Request,
  context: RouteContext<"/api/orders/[id]">
) {
  try {
    await requireAdminRequest(req);

    const body = await req.json().catch(() => null);
    const { id: orderId } = await context.params;

    if (!orderId) {
      throw new ApiError(400, "INVALID_ORDER_ID", "Order ID is missing.");
    }

    if (body && typeof body.fee === "number") {
      const updated = await confirmDeliveryQuote(
        orderId,
        body.fee,
        body.notes || ""
      );
      return NextResponse.json(updated);
    }

    if (body?.status) {
      const updated = await updateOrderStatus(orderId, body.status);
      return NextResponse.json(updated);
    }

    throw new ApiError(
      400,
      "INVALID_REQUEST",
      "Either fee or status is required."
    );
  } catch (error) {
    const response = getApiErrorResponse(error);
    return NextResponse.json(
      {
        code: response.body.error.code,
        message: response.body.error.message,
      },
      { status: response.status }
    );
  }
}