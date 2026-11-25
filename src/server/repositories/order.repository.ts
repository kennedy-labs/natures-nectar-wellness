import { db } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
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
      const updated = await transaction.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,
          stockQuantity: { gte: item.quantity },
        },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });

      if (updated.count === 0) {
        throw new ApiError(
          400,
          "INSUFFICIENT_STOCK",
          `${item.productName} does not have enough stock.`
        );
      }
    }

    const mapUrl = buildGoogleMapsPinUrl(
      data.delivery.latitude,
      data.delivery.longitude
    );
    const hasFreeDelivery =
      data.delivery.method === "PICKUP" ||
      data.delivery.method === "LOCAL_DELIVERY";

    const order = await transaction.order.create({
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      data: {
        orderNumber: data.orderNumber,
        status: initialStatus,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email,
        deliveryMethod: data.delivery.method,
        deliveryLocation: data.delivery.location,
        deliveryNotes: appendGpsPinToNotes(data.delivery.notes, mapUrl),
        deliveryFee: hasFreeDelivery ? 0 : null,
        subtotalAmount: data.subtotalAmount,
        totalAmount: hasFreeDelivery ? data.subtotalAmount : null,
        preferredPaymentMethod: data.preferredPaymentMethod,
        customerNotes: data.customerNotes,
        whatsappMessage: data.whatsappMessage,
        customer: {
          create: {
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email,
          },
        },
        items: {
          create: data.items,
        },
        OrderStatusHistory: {
          create: {
            status: initialStatus,
          },
        },
        ...(data.preferredPaymentMethod
          ? {
              payments: {
                create: {
                  method: data.preferredPaymentMethod,
                  status: "PENDING",
                },
              },
            }
          : {}),
      },
    });

    return order;
  });
}