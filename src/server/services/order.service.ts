import { z } from "zod";
import { createOrderRequest } from "@/server/repositories/order.repository";
import { findActiveProductsByIds } from "@/server/repositories/product.repository";
import {
  createOrderNumber,
  createWhatsappOrderMessage,
} from "@/features/orders/utils/order.utils";
import { submitOrderSchema } from "@/features/orders/validations/order.validation";
import { db } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
import { getPaymentGatewayAvailability } from "@/server/services/payment-gateway.service";
import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

/**
 * ADMIN ORDERS
 */
export async function getOrdersForAdmin() {
  return db.order.findMany({
    where: {
      NOT: {
        AND: [
          { preferredPaymentMethod: "MPESA_BUY_GOODS" },
          {
            payments: {
              none: {
                status: "VERIFIED",
              },
            },
          },
          {
            OR: [
              { status: "AWAITING_PAYMENT" },
              {
                AND: [
                  { status: "CANCELLED" },
                  {
                    OrderStatusHistory: {
                      none: {
                        status: {
                          in: [
                            "PENDING",
                            "PAID",
                            "PROCESSING",
                            "OUT_FOR_DELIVERY",
                            "DELIVERED",
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    },
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

async function releaseExpiredMpesaHolds(minutes = 30) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const expiredHolds = await db.order.findMany({
    where: {
      preferredPaymentMethod: "MPESA_BUY_GOODS",
      status: "AWAITING_PAYMENT",
      createdAt: { lt: cutoff },
      payments: {
        none: { status: "VERIFIED" },
      },
    },
    select: { id: true },
    take: 20,
  });

  for (const hold of expiredHolds) {
    try {
      await cancelOrder(hold.id);
    } catch {
      // Concurrent release or verification already transitioned this order
    }
  }
}

/**
 * CHECKOUT
 */
export async function submitOrder(input: unknown) {
  const data = submitOrderSchema.parse(input);
  const isMpesaCheckout = data.preferredPaymentMethod === "MPESA_BUY_GOODS";

  if (isMpesaCheckout) {
    const gateway = getPaymentGatewayAvailability();
    if (!gateway.darajaEnabled) {
      throw new ApiError(
        400,
        "MPESA_NOT_CONFIGURED",
        "Instant M-Pesa payment is not activated yet. Please select Cash on Pickup or configure Safaricom Daraja credentials."
      );
    }
  }

  await releaseExpiredMpesaHolds(30);

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
    initialStatus: isMpesaCheckout ? "AWAITING_PAYMENT" : "PENDING",
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

const FULFILLMENT_STATUSES = [
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
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

  if (status === "CANCELLED") {
    return cancelOrder(orderId);
  }

  const validStatus = status as OrderStatus;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  if (order.status === "CANCELLED") {
    throw new ApiError(
      400,
      "ORDER_CANCELLED",
      "Cancelled orders cannot be transitioned to another status."
    );
  }

  if (order.status === "DELIVERED" && validStatus !== "DELIVERED") {
    throw new ApiError(
      400,
      "ORDER_ALREADY_DELIVERED",
      "Delivered orders cannot be moved backward."
    );
  }

  const isPaid = order.payments?.some((p) => p.status === "VERIFIED");
  const isCashOnFulfillment =
    order.preferredPaymentMethod === "CASH_ON_PICKUP" ||
    order.preferredPaymentMethod === "CASH_ON_DELIVERY";

  if (validStatus === "PAID" && !isPaid) {
    throw new ApiError(
      400,
      "PAYMENT_NOT_VERIFIED",
      "Cannot mark order as PAID without a verified payment."
    );
  }

  if (
    (FULFILLMENT_STATUSES as readonly string[]).includes(validStatus) &&
    !isPaid &&
    !isCashOnFulfillment
  ) {
    throw new ApiError(
      400,
      "PAYMENT_REQUIRED",
      "Payment must be verified before processing or delivering this order."
    );
  }

  const normalizedStatus: OrderStatus =
    isPaid && validStatus === "PENDING"
      ? ("PROCESSING" as OrderStatus)
      : validStatus;

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

  if (["DELIVERED", "CANCELLED"].includes(order.status)) {
    throw new ApiError(
      400,
      "CANNOT_CANCEL_ORDER",
      "Delivered or already cancelled orders cannot be cancelled."
    );
  }

  return db.$transaction(async (tx) => {
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

    await tx.payment.updateMany({
      where: {
        orderId,
        status: {
          in: ["PENDING", "AWAITING_VERIFICATION"],
        },
      },
      data: {
        status: "FAILED",
        notes: "Order cancelled; pending payment voided.",
      },
    });

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
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
        status: "CANCELLED",
      },
    });

    return updated;
  });
}

const releaseMpesaHoldSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
});

export async function releaseUnpaidMpesaHold(rawInput: unknown) {
  const input = releaseMpesaHoldSchema.parse(rawInput);

  const order = await db.order.findFirst({
    where: {
      id: input.orderId,
      orderNumber: input.orderNumber,
    },
    include: {
      payments: true,
    },
  });

  if (!order) {
    return { released: false };
  }

  const hasVerifiedPayment = order.payments.some((p) => p.status === "VERIFIED");
  if (
    hasVerifiedPayment ||
    order.preferredPaymentMethod !== "MPESA_BUY_GOODS" ||
    order.status !== "AWAITING_PAYMENT"
  ) {
    return { released: false };
  }

  await cancelOrder(order.id);
  return { released: true };
}

export async function expireStaleUnpaidOrders(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const staleOrders = await db.order.findMany({
    where: {
      status: {
        in: ["PENDING", "REVIEWING_DELIVERY", "AWAITING_PAYMENT"],
      },
      createdAt: {
        lt: cutoff,
      },
      payments: {
        none: {
          status: "VERIFIED",
        },
      },
    },
    select: {
      id: true,
      orderNumber: true,
    },
  });

  const cancelledOrderNumbers: string[] = [];

  for (const stale of staleOrders) {
    await cancelOrder(stale.id);
    cancelledOrderNumbers.push(stale.orderNumber);
  }

  return {
    cancelledCount: cancelledOrderNumbers.length,
    orderNumbers: cancelledOrderNumbers,
  };
}

/**
 * DELIVERY QUOTE
 */
export async function confirmDeliveryQuote(
  orderId: string,
  fee: number,
  notes: string
) {
  if (!orderId) {
    throw new ApiError(400, "INVALID_ORDER_ID", "Missing order ID.");
  }

  if (!Number.isFinite(fee) || fee < 0) {
    throw new ApiError(
      400,
      "INVALID_DELIVERY_FEE",
      "Delivery fee must be 0 or greater."
    );
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  if (["DELIVERED", "CANCELLED"].includes(order.status)) {
    throw new ApiError(
      400,
      "ORDER_CLOSED",
      "Cannot quote delivery for a closed order."
    );
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

/**
 * PAYMENT VERIFICATION
 */
const verifyPaymentInputSchema = z.object({
  transactionRef: z.string().trim().optional(),
  amount: z.number().positive().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function verifyPaymentAndMarkPaid(
  paymentId: string,
  rawInput: unknown
) {
  if (!paymentId) {
    throw new ApiError(400, "INVALID_PAYMENT_ID", "Payment ID is required.");
  }

  const parsed = verifyPaymentInputSchema.parse(rawInput ?? {});

  const existingPayment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!existingPayment) {
    throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
  }

  if (existingPayment.order.status === "CANCELLED") {
    throw new ApiError(
      400,
      "ORDER_CANCELLED",
      "Cannot verify payment for a cancelled order."
    );
  }

  const requiresExternalRef =
    existingPayment.method === "MPESA_BUY_GOODS" ||
    existingPayment.method === "BANK_TRANSFER";

  const normalizedRef = parsed.transactionRef?.trim().toUpperCase();

  if (requiresExternalRef && (!normalizedRef || normalizedRef.length < 4)) {
    throw new ApiError(
      400,
      "TRANSACTION_REF_REQUIRED",
      "Enter a valid M-Pesa or bank transaction reference (at least 4 characters)."
    );
  }

  if (normalizedRef) {
    const duplicate = await db.payment.findFirst({
      where: {
        id: { not: paymentId },
        status: "VERIFIED",
        transactionRef: normalizedRef,
      },
      include: { order: { select: { orderNumber: true } } },
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "DUPLICATE_TRANSACTION_REF",
        `Transaction reference ${normalizedRef} is already verified on order ${duplicate.order.orderNumber}.`
      );
    }
  }

  const verifiedAmount =
    parsed.amount ??
    existingPayment.amount ??
    existingPayment.order.totalAmount ??
    existingPayment.order.subtotalAmount;

  return db.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        transactionRef: normalizedRef || `CASH-${existingPayment.order.orderNumber}`,
        amount: verifiedAmount,
        notes: parsed.notes || existingPayment.notes,
        verifiedAt: new Date(),
      },
    });

    const nextOrderStatus = ["PENDING", "REVIEWING_DELIVERY", "AWAITING_PAYMENT"].includes(
      existingPayment.order.status
    )
      ? "PAID"
      : existingPayment.order.status;

    const order = await tx.order.update({
      where: { id: existingPayment.orderId },
      data: { status: nextOrderStatus },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    if (nextOrderStatus === "PAID" && existingPayment.order.status !== "PAID") {
      await tx.orderStatusHistory.create({
        data: {
          orderId: existingPayment.orderId,
          status: "PAID",
        },
      });
    }

    return { payment, order };
  });
}

/**
 * PUBLIC CUSTOMER ORDER TRACKING
 */
const trackOrderInputSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(4, "Enter your order number (e.g. NNW-...).")
    .max(40),
  phone: z
    .string()
    .trim()
    .min(9, "Enter the phone number used when placing the order.")
    .max(25),
});

function extractPhoneTail(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export async function trackCustomerOrder(rawInput: unknown) {
  const input = trackOrderInputSchema.parse(rawInput);
  const normalizedOrderNumber = input.orderNumber.toUpperCase();
  const inputPhoneTail = extractPhoneTail(input.phone);

  const order = await db.order.findUnique({
    where: {
      orderNumber: normalizedOrderNumber,
    },
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          productSlug: true,
          quantity: true,
          lineTotal: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          transactionRef: true,
          verifiedAt: true,
        },
      },
      OrderStatusHistory: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (
    !order ||
    !inputPhoneTail ||
    extractPhoneTail(order.customerPhone) !== inputPhoneTail
  ) {
    throw new ApiError(
      404,
      "ORDER_NOT_FOUND",
      "No matching order was found for that order number and phone number."
    );
  }

  const verifiedPayment =
    order.payments.find((p) => p.status === "VERIFIED") ?? null;
  const latestPayment = verifiedPayment ?? order.payments[0] ?? null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    deliveryMethod: order.deliveryMethod,
    deliveryLocation: order.deliveryLocation,
    deliveryFee: order.deliveryFee,
    deliveryQuoteNotes: order.deliveryQuoteNotes,
    subtotalAmount: order.subtotalAmount,
    totalAmount: order.totalAmount ?? order.subtotalAmount,
    preferredPaymentMethod: order.preferredPaymentMethod,
    whatsappMessage: order.whatsappMessage ?? "",
    customerPhone: order.customerPhone,
    items: order.items,
    payment: latestPayment
      ? {
          status: latestPayment.status,
          method: latestPayment.method,
          amount: latestPayment.amount,
          transactionRef:
            latestPayment.status === "VERIFIED"
              ? latestPayment.transactionRef
              : null,
          verifiedAt: latestPayment.verifiedAt
            ? latestPayment.verifiedAt.toISOString()
            : null,
        }
      : null,
    statusHistory: order.OrderStatusHistory.map((h) => ({
      id: h.id,
      status: h.status,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}