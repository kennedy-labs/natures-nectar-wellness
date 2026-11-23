import { db } from "@/server/db/prisma";
import {
  appendGpsPinToNotes,
  buildGoogleMapsPinUrl,
} from "@/features/orders/utils/order.utils";
import { SubmitOrderInput } from "@/features/orders/validations/order.validation";

export type CreateOrderRequestData = SubmitOrderInput & {
  orderNumber: string;
  subtotalAmount: number;
  whatsappMessage: string;
  initialStatus?: "PENDING" | "AWAITING_PAYMENT";
  items: Array<{
    productId: string;
    productName: string;
    productSlug: string;
    quantity: number;
    priceAtPurchase: number;
    lineTotal: number;
  }>;
};

export async function createOrderRequest(data: CreateOrderRequestData) {
  const initialStatus = data.initialStatus ?? "PENDING";

  return db.$transaction(async (transaction) => {
    for (const item of data.items) {
      await transaction.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    const customer = await transaction.customer.create({
      data: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
      },
    });

    const mapUrl = buildGoogleMapsPinUrl(
      data.delivery.latitude,
      data.delivery.longitude
    );

    const order = await transaction.order.create({
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      data: {
        orderNumber: data.orderNumber,
        status: initialStatus,
        customerId: customer.id,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email,
        deliveryMethod: data.delivery.method,
        deliveryLocation: data.delivery.location,
        deliveryNotes: appendGpsPinToNotes(data.delivery.notes, mapUrl),
        subtotalAmount: data.subtotalAmount,
        preferredPaymentMethod: data.preferredPaymentMethod,
        customerNotes: data.customerNotes,
        whatsappMessage: data.whatsappMessage,
        items: {
          create: data.items,
        },
      },
    });

    await transaction.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: initialStatus,
      },
    });

if (data.preferredPaymentMethod) {
  await transaction.payment.create({
    data: {
      orderId: order.id,
      method: data.preferredPaymentMethod,
      status: "PENDING",
    },
  });
}

return transaction.order.findUnique({
  where: {
    id: order.id,
  },
  include: {
    customer: true,
    items: true,
    payments: true,
  },
});

});
}