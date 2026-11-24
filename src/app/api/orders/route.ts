import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminRequest } from "@/server/auth/admin-auth";
import {
  apiCreated,
  apiFail,
  apiOk,
  readJson,
} from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";
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
    enforceRateLimit(req, {
      keyPrefix: "orders-create",
      limit: 12,
      windowMs: 10 * 60_000,
      message: "Too many orders submitted quickly. Please wait a few minutes and try again.",
    });

    const body = await readJson(req);

    if (!body) {
      throw new ApiError(400, "INVALID_REQUEST", "Request body is missing.");
    }

    const order = await submitOrder(body);

    revalidateTag("products", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");

    return apiCreated(order);
  } catch (error) {
    return apiFail(error);
  }
}