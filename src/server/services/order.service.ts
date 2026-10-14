import { createOrderRequest } from "@/server/repositories/order.repository";
import { findActiveProductsByIds } from "@/server/repositories/product.repository";
import {
  createOrderNumber,
  createWhatsappOrderMessage,
} from "@/features/orders/utils/order.utils";
import { submitOrderSchema } from "@/features/orders/validations/order.validation";
import { db } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

/**
 * ADMIN ORDERS
 */
export async function getOrdersForAdmin() {
  return db.order.findMany({
    include: {
      customer: true,
      items: true,
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * CHECKOUT
 */
export async function submitOrder(input: unknown) {
  const data = submitOrderSchema.parse(input);

  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const products = await findActiveProductsByIds(productIds);

  const productsById = new Map(products.map((p) => [p.id, p]));

  const orderItems: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      quantity: number;
      priceAtPurchase: number;
      lineTotal: number;
    }> = [];

  for (const item of data.items) {
    const product = productsById.get(item.productId);

    if (!product) {
      throw new ApiError(400, "PRODUCT_UNAVAILABLE", "Product not available.");
    }

    const productFresh = await db.product.findUnique({
      where: { id: product.id },
      select: { stockQuantity: true },
    });

    if (!productFresh || productFresh.stockQuantity < item.quantity) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `${product.name} does not have enough stock.`
      );
    }

    orderItems.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity: item.quantity,
      priceAtPurchase: product.price,
      lineTotal: product.price * item.quantity,
    });
  }

  const subtotalAmount = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const orderNumber = createOrderNumber();

  const whatsappMessage = createWhatsappOrderMessage({
    orderNumber,
    customer: data.customer,
    delivery: data.delivery,
    items: orderItems.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotalAmount,
  });

  const order = await createOrderRequest({
    orderNumber,
    customer: data.customer,
    delivery: data.delivery,
    subtotalAmount,
    preferredPaymentMethod: data.preferredPaymentMethod,
    customerNotes: data.customerNotes,
    whatsappMessage,
    items: orderItems,
  });
  

  return order;
}

/**
 * ORDER STATUS + PAYMENT SAFETY
 */

const ALLOWED_ORDER_STATUSES = [
  "PENDING",
  "REVIEWING_DELIVERY",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = PrismaOrderStatus;

export async function updateOrderStatus(orderId: string, status: string) {
  if (!orderId) {
    throw new ApiError(400, "INVALID_ORDER_ID", "Missing order ID.");
  }

  if (!ALLOWED_ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new ApiError(
      400,
      "INVALID_STATUS",
      "Order status is not allowed."
    );
  }

  const validStatus = status as OrderStatus;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  const isPaid = order.payments?.some((p) => p.status === "VERIFIED");

  if (status === "PAID" && !isPaid) {
    throw new ApiError(
      400,
      "PAYMENT_NOT_VERIFIED",
      "Cannot mark order as PAID without verified payment."
    );
  }

  const normalizedStatus: OrderStatus =
    isPaid && validStatus === "PENDING" ? ("PROCESSING" as OrderStatus) : validStatus;

  await db.orderStatusHistory.create({
    data: {
      orderId,
      status: normalizedStatus,
    },
  });

  return db.order.update({
    where: { id: orderId },
    data: {
      status: normalizedStatus,
    },
    include: {
      customer: true,
      items: true,
      payments: true,
    },
  });
}

export async function cancelOrder(orderId: string) {
  if (!orderId) {
    throw new ApiError(400, "INVALID_ORDER_ID", "Missing order ID.");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  if (["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)) {
    throw new ApiError(
      400,
      "CANNOT_CANCEL_ORDER",
      "This order cannot be cancelled."
    );
  }

  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CANCELLED",
      },
    });
  });
}

/**
 * DELIVERY QUOTE
 */
export async function confirmDeliveryQuote(orderId: string, fee: number, notes: string) {
  if (!orderId) {
    throw new ApiError(400, "INVALID_ORDER_ID", "Missing order ID.");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  return db.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        deliveryFee: fee,
        deliveryQuoteNotes: notes,
        deliveryConfirmedAt: new Date(),
        totalAmount: order.subtotalAmount + fee,
        status: "AWAITING_PAYMENT",
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "AWAITING_PAYMENT",
      },
    });

    return updatedOrder;
  });
}