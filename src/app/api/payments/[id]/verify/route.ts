import { db } from "@/server/db/prisma";
import { apiFail, apiOk } from "@/server/http/api-response";
import { requireAdminRequest } from "@/server/auth/admin-auth";

export async function PATCH(req: Request) {
  try {
    await requireAdminRequest(req);

    const url = new URL(req.url);
    const paymentId = url.pathname.split("/").at(-2);

    if (!paymentId) {
      throw new Error("Payment ID is required.");
    }

    const existingPayment = await db.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!existingPayment) {
      throw new Error("Payment not found.");
    }

    const payment = await db.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    return apiOk(payment);
  } catch (error) {
    return apiFail(error);
  }
}