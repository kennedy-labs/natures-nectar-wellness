import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSiteUrl } from "@/config/site";
import { db } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";
import { createMinimalOrderWhatsappMessage } from "@/features/whatsapp/utils/whatsapp.utils";
import { sendOrderNotifications } from "@/server/services/notification.service";

export type PaymentGatewayAvailability = {
  darajaEnabled: boolean;
  paystackEnabled: boolean;
  darajaEnv: "sandbox" | "production";
};

function getDarajaConfig() {
  const envRaw = (process.env.DARAJA_ENV ?? "sandbox").trim().toLowerCase();
  const darajaEnv: "sandbox" | "production" =
    envRaw === "production" ? "production" : "sandbox";

  const consumerKey = process.env.DARAJA_CONSUMER_KEY?.trim() ?? "";
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET?.trim() ?? "";
  const shortCode = process.env.DARAJA_SHORTCODE?.trim() ?? "";
  const passkey = process.env.DARAJA_PASSKEY?.trim() ?? "";
  const partyB = process.env.DARAJA_PARTY_B?.trim() || shortCode;
  const transactionType =
    process.env.DARAJA_TRANSACTION_TYPE?.trim() === "CustomerBuyGoodsOnline"
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline";
  const callbackSecret = process.env.DARAJA_CALLBACK_SECRET?.trim() ?? "";
  const customCallbackUrl = process.env.DARAJA_CALLBACK_URL?.trim() ?? "";

  const baseUrl =
    darajaEnv === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  const enabled = Boolean(
    consumerKey && consumerSecret && shortCode && passkey
  );

  let callbackUrl =
    customCallbackUrl || `${getSiteUrl()}/api/payments/mpesa/callback`;
  if (callbackSecret && !callbackUrl.includes("token=")) {
    const joiner = callbackUrl.includes("?") ? "&" : "?";
    callbackUrl = `${callbackUrl}${joiner}token=${encodeURIComponent(callbackSecret)}`;
  }

  return {
    enabled,
    darajaEnv,
    baseUrl,
    consumerKey,
    consumerSecret,
    shortCode,
    partyB,
    transactionType,
    passkey,
    callbackUrl,
    callbackSecret,
  };
}

function getPaystackConfig() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
  return {
    enabled: Boolean(secretKey),
    secretKey,
    baseUrl: "https://api.paystack.co",
  };
}

export function getPaymentGatewayAvailability(): PaymentGatewayAvailability {
  const daraja = getDarajaConfig();
  const paystack = getPaystackConfig();

  return {
    darajaEnabled: daraja.enabled,
    paystackEnabled: paystack.enabled,
    darajaEnv: daraja.darajaEnv,
  };
}

export function normalizeKenyanPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (digits.startsWith("0") && digits.length === 10) {
    digits = `254${digits.slice(1)}`;
  } else if (
    (digits.startsWith("7") || digits.startsWith("1")) &&
    digits.length === 9
  ) {
    digits = `254${digits}`;
  }

  if (!/^254[71]\d{8}$/.test(digits)) {
    throw new ApiError(
      400,
      "INVALID_MPESA_PHONE",
      "Enter a valid Kenyan M-Pesa phone number (e.g. 0712 345 678 or 254712345678)."
    );
  }

  return digits;
}

function getDarajaTimestamp(): string {
  // Daraja requires EAT (Africa/Nairobi, UTC+3) in YYYYMMDDHHmmss
  const nairobiMs = Date.now() + 3 * 60 * 60 * 1000;
  const d = new Date(nairobiMs);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

async function getDarajaAccessToken(): Promise<string> {
  const cfg = getDarajaConfig();
  const auth = Buffer.from(
    `${cfg.consumerKey}:${cfg.consumerSecret}`
  ).toString("base64");

  const res = await fetch(
    `${cfg.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    }
  );

  const data = (await res.json().catch(() => null)) as {
    access_token?: string;
    errorMessage?: string;
  } | null;

  if (!res.ok || !data?.access_token) {
    throw new ApiError(
      502,
      "DARAJA_AUTH_FAILED",
      data?.errorMessage || "Failed to authenticate with Safaricom Daraja."
    );
  }

  return data.access_token;
}

async function loadOrderForPayment(orderId: string, orderNumber: string) {
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      orderNumber,
    },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Matching order was not found.");
  }

  if (order.status === "CANCELLED") {
    throw new ApiError(
      400,
      "ORDER_CANCELLED",
      "Cannot pay for a cancelled order."
    );
  }

  const alreadyVerified = order.payments.find((p) => p.status === "VERIFIED");
  if (alreadyVerified || order.status === "PAID") {
    throw new ApiError(
      409,
      "ORDER_ALREADY_PAID",
      "This order has already been paid and verified."
    );
  }

  const expectedAmount = order.totalAmount ?? order.subtotalAmount;
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new ApiError(
      400,
      "INVALID_ORDER_AMOUNT",
      "Order total amount must be greater than zero."
    );
  }

  return { order, expectedAmount };
}

async function upsertPendingGatewayPayment(args: {
  orderId: string;
  expectedAmount: number;
  transactionRef: string;
  notes: string;
}) {
  const existing = await db.payment.findFirst({
    where: {
      orderId: args.orderId,
      status: { not: "VERIFIED" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return db.payment.update({
      where: { id: existing.id },
      data: {
        method: "MPESA_BUY_GOODS",
        status: "AWAITING_VERIFICATION",
        amount: args.expectedAmount,
        transactionRef: args.transactionRef,
        notes: args.notes,
      },
    });
  }

  return db.payment.create({
    data: {
      orderId: args.orderId,
      method: "MPESA_BUY_GOODS",
      status: "AWAITING_VERIFICATION",
      amount: args.expectedAmount,
      transactionRef: args.transactionRef,
      notes: args.notes,
    },
  });
}

async function markGatewayPaymentVerified(args: {
  paymentId: string;
  orderId: string;
  orderStatus: string;
  transactionRef: string;
  paidAmount: number;
  notes: string;
}) {
  const duplicate = await db.payment.findFirst({
    where: {
      id: { not: args.paymentId },
      status: "VERIFIED",
      transactionRef: args.transactionRef,
    },
    select: { id: true, orderId: true },
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "DUPLICATE_TRANSACTION_REF",
      `Payment reference ${args.transactionRef} has already been recorded.`
    );
  }

  const result = await db.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({
      where: { id: args.paymentId },
      include: { order: true },
    });

    if (current?.status === "VERIFIED") {
      return {
        payment: current,
        order: current.order,
        alreadyVerified: true,
      };
    }

    const payment = await tx.payment.update({
      where: { id: args.paymentId },
      data: {
        status: "VERIFIED",
        transactionRef: args.transactionRef,
        amount: args.paidAmount,
        notes: args.notes,
        verifiedAt: new Date(),
      },
    });

    const nextOrderStatus = [
      "PENDING",
      "REVIEWING_DELIVERY",
      "AWAITING_PAYMENT",
      "PAID",
    ].includes(args.orderStatus)
      ? current?.order.status === "REVIEWING_DELIVERY" &&
        current.order.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
        current.order.deliveryFee == null
        ? "REVIEWING_DELIVERY"
        : "PROCESSING"
      : args.orderStatus;

    const order = await tx.order.update({
      where: { id: args.orderId },
      data: {
        status: nextOrderStatus as
          | "PENDING"
          | "REVIEWING_DELIVERY"
          | "AWAITING_PAYMENT"
          | "PAID"
          | "PROCESSING"
          | "OUT_FOR_DELIVERY"
          | "DELIVERED"
          | "CANCELLED",
      },
    });

    if (nextOrderStatus !== args.orderStatus) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: args.orderId,
          status: nextOrderStatus as
            | "REVIEWING_DELIVERY"
            | "AWAITING_PAYMENT"
            | "PROCESSING"
            | "OUT_FOR_DELIVERY"
            | "DELIVERED"
            | "CANCELLED",
        },
      });
    }

    return { payment, order, alreadyVerified: false };
  });

  if (!result.alreadyVerified) {
    await sendOrderNotifications({
      orderId: args.orderId,
      event: "PAYMENT_VERIFIED",
      transactionRef: args.transactionRef,
      paidAmount: args.paidAmount,
    }).catch((err) => {
      console.error("[PaymentGateway] Notification failed after verification:", err);
    });
  }

  revalidatePath("/admin");
  return { payment: result.payment, order: result.order };
}

const stkInitiateSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  phone: z.string().min(9),
});

export async function initiateMpesaStkPush(rawInput: unknown) {
  const cfg = getDarajaConfig();
  if (!cfg.enabled) {
    throw new ApiError(
      503,
      "DARAJA_NOT_CONFIGURED",
      "Safaricom Daraja STK Push credentials are not configured yet."
    );
  }

  const input = stkInitiateSchema.parse(rawInput);
  const msisdn = normalizeKenyanPhone(input.phone);
  const { order, expectedAmount } = await loadOrderForPayment(
    input.orderId,
    input.orderNumber
  );

  // Safaricom STK Push expects an integer amount >= 1 KES
  const stkAmount = Math.max(1, Math.ceil(expectedAmount));
  const timestamp = getDarajaTimestamp();
  const password = Buffer.from(
    `${cfg.shortCode}${cfg.passkey}${timestamp}`
  ).toString("base64");
  const accessToken = await getDarajaAccessToken();

  const res = await fetch(`${cfg.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: cfg.transactionType,
      Amount: stkAmount,
      PartyA: msisdn,
      PartyB: cfg.partyB,
      PhoneNumber: msisdn,
      CallBackURL: cfg.callbackUrl,
      AccountReference: order.orderNumber.slice(0, 12),
      TransactionDesc: `Order ${order.orderNumber}`,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    ResponseCode?: string;
    ResponseDescription?: string;
    CustomerMessage?: string;
    errorMessage?: string;
  } | null;

  if (!res.ok || data?.ResponseCode !== "0" || !data.CheckoutRequestID) {
    throw new ApiError(
      502,
      "DARAJA_STK_FAILED",
      data?.errorMessage ||
        data?.ResponseDescription ||
        "Safaricom M-Pesa prompt could not be initiated."
    );
  }

  const payment = await upsertPendingGatewayPayment({
    orderId: order.id,
    expectedAmount,
    transactionRef: data.CheckoutRequestID,
    notes: `M-Pesa STK Push sent to ${msisdn} (KES ${stkAmount})`,
  });

  return {
    paymentId: payment.id,
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID ?? null,
    customerMessage:
      data.CustomerMessage ||
      "M-Pesa prompt sent to your phone. Enter your PIN to complete payment.",
    amount: stkAmount,
    phone: msisdn,
  };
}

type DarajaCallbackPayload = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string;
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: {
        Item?: Array<{ Name?: string; Value?: string | number }>;
      };
    };
  };
};

export async function handleMpesaCallback(
  rawBody: unknown,
  providedToken?: string | null
) {
  const cfg = getDarajaConfig();
  if (cfg.callbackSecret) {
    if (!providedToken || providedToken !== cfg.callbackSecret) {
      throw new ApiError(
        401,
        "INVALID_CALLBACK_TOKEN",
        "Unauthorized Daraja callback token."
      );
    }
  }

  const payload = (rawBody ?? {}) as DarajaCallbackPayload;
  const callback = payload.Body?.stkCallback;

  if (!callback?.CheckoutRequestID) {
    throw new ApiError(
      400,
      "INVALID_DARAJA_CALLBACK",
      "Missing CheckoutRequestID in Daraja callback payload."
    );
  }

  const payment = await db.payment.findFirst({
    where: {
      transactionRef: callback.CheckoutRequestID,
    },
    include: {
      order: true,
    },
  });

  if (!payment) {
    // Unknown or stale CheckoutRequestID — acknowledge gracefully so Safaricom stops retrying
    return { matched: false, status: "IGNORED" as const };
  }

  if (payment.status === "VERIFIED") {
    return { matched: true, status: "ALREADY_VERIFIED" as const };
  }

  const resultCode = Number(callback.ResultCode ?? -1);
  if (resultCode !== 0) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        notes: `M-Pesa STK declined/cancelled: ${callback.ResultDesc || `Code ${resultCode}`}`,
      },
    });
    revalidatePath("/admin");
    return { matched: true, status: "FAILED" as const };
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const getMeta = (name: string) =>
    items.find((i) => i.Name === name)?.Value;

  const receipt = String(getMeta("MpesaReceiptNumber") ?? "")
    .trim()
    .toUpperCase();
  const paidAmountRaw = Number(getMeta("Amount") ?? 0);
  const expectedAmount =
    payment.amount ?? payment.order.totalAmount ?? payment.order.subtotalAmount;

  if (!receipt) {
    throw new ApiError(
      400,
      "MISSING_MPESA_RECEIPT",
      "Missing MpesaReceiptNumber in successful callback."
    );
  }

  if (!Number.isFinite(paidAmountRaw) || paidAmountRaw + 0.01 < expectedAmount) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        notes: `Underpaid M-Pesa callback (received KES ${paidAmountRaw}, expected KES ${expectedAmount}, Ref: ${receipt})`,
      },
    });
    return { matched: true, status: "AMOUNT_MISMATCH" as const };
  }

  await markGatewayPaymentVerified({
    paymentId: payment.id,
    orderId: payment.orderId,
    orderStatus: payment.order.status,
    transactionRef: receipt,
    paidAmount: paidAmountRaw,
    notes: `Verified via Safaricom M-Pesa STK Push (Ref: ${receipt})`,
  });

  return { matched: true, status: "VERIFIED" as const, receipt };
}

const statusQuerySchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
});

export async function queryOrderPaymentStatus(rawInput: unknown) {
  const input = statusQuerySchema.parse(rawInput);
  const order = await db.order.findFirst({
    where: {
      id: input.orderId,
      orderNumber: input.orderNumber,
    },
    include: {
      payments: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Order not found.");
  }

  const verified = order.payments.find((p) => p.status === "VERIFIED");
  if (verified) {
    return {
      orderStatus: order.status,
      paymentStatus: "VERIFIED" as const,
      transactionRef: verified.transactionRef,
      amount: verified.amount ?? order.totalAmount ?? order.subtotalAmount,
      message: `Payment verified (Ref: ${verified.transactionRef}).`,
    };
  }

  const latest = order.payments[0];
  if (!latest) {
    return {
      orderStatus: order.status,
      paymentStatus: "PENDING" as const,
      transactionRef: null,
      amount: order.totalAmount ?? order.subtotalAmount,
      message: "Waiting for payment initiation.",
    };
  }

  // If Daraja STK Push is still AWAITING_VERIFICATION, proactively query Safaricom
  const cfg = getDarajaConfig();
  if (
    cfg.enabled &&
    latest.status === "AWAITING_VERIFICATION" &&
    latest.transactionRef?.startsWith("ws_CO_")
  ) {
    try {
      const timestamp = getDarajaTimestamp();
      const password = Buffer.from(
        `${cfg.shortCode}${cfg.passkey}${timestamp}`
      ).toString("base64");
      const accessToken = await getDarajaAccessToken();

      const res = await fetch(`${cfg.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: cfg.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: latest.transactionRef,
        }),
        cache: "no-store",
      });

      const queryData = (await res.json().catch(() => null)) as {
        ResultCode?: string | number;
        ResultDesc?: string;
      } | null;

      if (res.ok && queryData && queryData.ResultCode !== undefined) {
        const codeStr = String(queryData.ResultCode);
        if (codeStr === "0") {
          const expectedAmount =
            latest.amount ?? order.totalAmount ?? order.subtotalAmount;
          const fallbackRef = latest.transactionRef;
          const verified = await markGatewayPaymentVerified({
            paymentId: latest.id,
            orderId: order.id,
            orderStatus: order.status,
            transactionRef: fallbackRef,
            paidAmount: expectedAmount,
            notes: `Verified via Daraja STK Query (${queryData.ResultDesc || "Success"})`,
          });

          return {
            orderStatus: verified.order.status,
            paymentStatus: "VERIFIED" as const,
            transactionRef: fallbackRef,
            amount: expectedAmount,
            message: "Payment verified via M-Pesa.",
          };
        }

        // Known terminal failure codes from Daraja STK Query (e.g. 1032 cancelled, 1037 timeout, 1 insufficient)
        if (["1", "1032", "1037", "2001"].includes(codeStr)) {
          await db.payment.update({
            where: { id: latest.id },
            data: {
              status: "FAILED",
              notes: `M-Pesa prompt not completed: ${queryData.ResultDesc || `Code ${codeStr}`}`,
            },
          });

          return {
            orderStatus: order.status,
            paymentStatus: "FAILED" as const,
            transactionRef: latest.transactionRef,
            amount: latest.amount ?? order.totalAmount ?? order.subtotalAmount,
            message:
              queryData.ResultDesc || "M-Pesa prompt was cancelled or timed out.",
          };
        }
      }
    } catch {
      // Transient query failures keep polling cleanly
    }
  }

  return {
    orderStatus: order.status,
    paymentStatus: latest.status,
    transactionRef: latest.transactionRef,
    amount: latest.amount ?? order.totalAmount ?? order.subtotalAmount,
    message:
      latest.status === "FAILED"
        ? latest.notes || "Payment was not completed."
        : "Waiting for customer M-Pesa confirmation...",
  };
}

const paystackInitSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  email: z.string().email().optional(),
});

export async function initializePaystackPayment(rawInput: unknown) {
  const cfg = getPaystackConfig();
  if (!cfg.enabled) {
    throw new ApiError(
      503,
      "PAYSTACK_NOT_CONFIGURED",
      "Paystack payment gateway is not configured yet."
    );
  }

  const input = paystackInitSchema.parse(rawInput);
  const { order, expectedAmount } = await loadOrderForPayment(
    input.orderId,
    input.orderNumber
  );

  const reference = `NNW-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
  const amountSubunits = Math.round(expectedAmount * 100);
  const payerEmail =
    input.email?.trim() ||
    order.customerEmail?.trim() ||
    `orders+${order.orderNumber.toLowerCase()}@naturesnectar.co.ke`;

  const callbackUrl = `${getSiteUrl()}/checkout?paystack_ref=${encodeURIComponent(reference)}&order_id=${encodeURIComponent(order.id)}&order_number=${encodeURIComponent(order.orderNumber)}`;

  const res = await fetch(`${cfg.baseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payerEmail,
      amount: amountSubunits,
      currency: "KES",
      reference,
      callback_url: callbackUrl,
      channels: ["mobile_money", "card"],
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: order.customerPhone,
      },
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url?: string;
      access_code?: string;
      reference?: string;
    };
  } | null;

  if (!res.ok || !data?.status || !data.data?.authorization_url) {
    throw new ApiError(
      502,
      "PAYSTACK_INIT_FAILED",
      data?.message || "Could not initialize Paystack checkout."
    );
  }

  await upsertPendingGatewayPayment({
    orderId: order.id,
    expectedAmount,
    transactionRef: reference,
    notes: `Paystack checkout initialized (Ref: ${reference})`,
  });

  return {
    reference,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code ?? null,
    amount: expectedAmount,
  };
}

const paystackVerifySchema = z.object({
  reference: z.string().min(4),
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
});

export async function verifyPaystackTransaction(rawInput: unknown) {
  const cfg = getPaystackConfig();
  if (!cfg.enabled) {
    throw new ApiError(
      503,
      "PAYSTACK_NOT_CONFIGURED",
      "Paystack payment gateway is not configured yet."
    );
  }

  const input = paystackVerifySchema.parse(rawInput);

  const order = await db.order.findFirst({
    where: {
      id: input.orderId,
      orderNumber: input.orderNumber,
    },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "Matching order was not found.");
  }

  const existingVerified = order.payments.find((p) => p.status === "VERIFIED");
  if (existingVerified) {
    return {
      orderNumber: order.orderNumber,
      whatsappMessage: createMinimalOrderWhatsappMessage({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        deliveryMethod: order.deliveryMethod,
        deliveryLocation: order.deliveryLocation,
        paymentStatus: "VERIFIED",
        preferredPaymentMethod: order.preferredPaymentMethod,
        isPaid: true,
      }),
      paymentStatus: "VERIFIED" as const,
      transactionRef: existingVerified.transactionRef,
      amount: existingVerified.amount ?? order.totalAmount ?? order.subtotalAmount,
    };
  }

  const res = await fetch(
    `${cfg.baseUrl}/transaction/verify/${encodeURIComponent(input.reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.secretKey}`,
      },
      cache: "no-store",
    }
  );

  const payload = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      channel?: string;
      metadata?: {
        orderId?: string;
        orderNumber?: string;
      };
    };
  } | null;

  const txData = payload?.data;
  if (!res.ok || !payload?.status || !txData) {
    throw new ApiError(
      502,
      "PAYSTACK_VERIFY_FAILED",
      payload?.message || "Failed to verify Paystack transaction."
    );
  }

  if (txData.status !== "success") {
    throw new ApiError(
      400,
      "PAYSTACK_NOT_PAID",
      `Payment is currently "${txData.status ?? "incomplete"}" on Paystack.`
    );
  }

  if (txData.currency !== "KES") {
    throw new ApiError(
      400,
      "INVALID_CURRENCY",
      `Expected KES payment currency, received ${txData.currency}.`
    );
  }

  if (
    txData.metadata?.orderId &&
    txData.metadata.orderId !== order.id
  ) {
    throw new ApiError(
      400,
      "ORDER_REFERENCE_MISMATCH",
      "Paystack payment reference does not belong to this order."
    );
  }

  const expectedAmount = order.totalAmount ?? order.subtotalAmount;
  const paidKes = (txData.amount ?? 0) / 100;

  if (!Number.isFinite(paidKes) || paidKes + 0.01 < expectedAmount) {
    throw new ApiError(
      400,
      "UNDERPAID_AMOUNT",
      `Paid amount KES ${paidKes} is less than order total KES ${expectedAmount}.`
    );
  }

  const paymentRow =
    order.payments.find((p) => p.transactionRef === input.reference) ??
    order.payments[0] ??
    (await upsertPendingGatewayPayment({
      orderId: order.id,
      expectedAmount,
      transactionRef: input.reference,
      notes: "Paystack transaction verified",
    }));

  await markGatewayPaymentVerified({
    paymentId: paymentRow.id,
    orderId: order.id,
    orderStatus: order.status,
    transactionRef: txData.reference || input.reference,
    paidAmount: paidKes,
    notes: `Verified via Paystack (${txData.channel || "online"})`,
  });

  return {
    orderNumber: order.orderNumber,
    whatsappMessage: createMinimalOrderWhatsappMessage({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryMethod: order.deliveryMethod,
      deliveryLocation: order.deliveryLocation,
      paymentStatus: "VERIFIED",
      preferredPaymentMethod: order.preferredPaymentMethod,
      isPaid: true,
    }),
    paymentStatus: "VERIFIED" as const,
    transactionRef: txData.reference || input.reference,
    amount: paidKes,
  };
}

export async function handlePaystackWebhook(
  rawBody: string,
  signatureHeader: string | null
) {
  const cfg = getPaystackConfig();
  if (!cfg.enabled) {
    throw new ApiError(
      503,
      "PAYSTACK_NOT_CONFIGURED",
      "Paystack secret key is not configured."
    );
  }

  if (!signatureHeader) {
    throw new ApiError(401, "MISSING_SIGNATURE", "Missing Paystack signature.");
  }

  const expectedHash = crypto
    .createHmac("sha512", cfg.secretKey)
    .update(rawBody)
    .digest("hex");

  const sigBuffer = Buffer.from(signatureHeader, "utf8");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, "INVALID_SIGNATURE", "Invalid Paystack signature.");
  }

  const eventPayload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
      channel?: string;
      metadata?: {
        orderId?: string;
        orderNumber?: string;
      };
    };
  };

  if (eventPayload.event !== "charge.success" || !eventPayload.data?.reference) {
    return { handled: false, reason: "IGNORED_EVENT" as const };
  }

  const txData = eventPayload.data;
  if (txData.currency !== "KES") {
    return { handled: false, reason: "NON_KES_CURRENCY" as const };
  }

  const orderId = txData.metadata?.orderId;
  const order = orderId
    ? await db.order.findUnique({
        where: { id: orderId },
        include: { payments: { orderBy: { createdAt: "desc" } } },
      })
    : await db.payment
        .findFirst({
          where: { transactionRef: txData.reference },
          include: {
            order: {
              include: { payments: { orderBy: { createdAt: "desc" } } },
            },
          },
        })
        .then((p) => p?.order ?? null);

  if (!order) {
    return { handled: false, reason: "ORDER_NOT_FOUND" as const };
  }

  if (order.payments.some((p) => p.status === "VERIFIED")) {
    return { handled: true, status: "ALREADY_VERIFIED" as const };
  }

  const expectedAmount = order.totalAmount ?? order.subtotalAmount;
  const paidKes = (txData.amount ?? 0) / 100;

  if (!Number.isFinite(paidKes) || paidKes + 0.01 < expectedAmount) {
    return { handled: false, reason: "AMOUNT_MISMATCH" as const };
  }

  const paymentRow =
    order.payments.find((p) => p.transactionRef === txData.reference) ??
    order.payments[0] ??
    (await upsertPendingGatewayPayment({
      orderId: order.id,
      expectedAmount,
      transactionRef: txData.reference!,
      notes: "Paystack webhook charge.success",
    }));

  await markGatewayPaymentVerified({
    paymentId: paymentRow.id,
    orderId: order.id,
    orderStatus: order.status,
    transactionRef: txData.reference!,
    paidAmount: paidKes,
    notes: `Verified via Paystack webhook (${txData.channel || "online"})`,
  });

  return { handled: true, status: "VERIFIED" as const };
}
