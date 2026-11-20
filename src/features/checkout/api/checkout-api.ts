import { readApiData } from "@/lib/api-client";

import type {
  CheckoutFormValues,
  CheckoutSubmitResponse,
  MpesaStkInitiateResponse,
  PaymentStatusPollResponse,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
} from "@/features/checkout/types/checkout.types";

export async function submitCheckoutOrder(
  payload: CheckoutFormValues & {
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  }
) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<CheckoutSubmitResponse>(response);
}

export async function initiateMpesaStk(payload: {
  orderId: string;
  orderNumber: string;
  phone: string;
}) {
  const response = await fetch("/api/payments/mpesa/stk-push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<MpesaStkInitiateResponse>(response);
}

export async function pollMpesaPaymentStatus(payload: {
  orderId: string;
  orderNumber: string;
}) {
  const response = await fetch("/api/payments/mpesa/status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<PaymentStatusPollResponse>(response);
}

export async function initializePaystackCheckout(payload: {
  orderId: string;
  orderNumber: string;
  email?: string;
}) {
  const response = await fetch("/api/payments/paystack/initialize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<PaystackInitializeResponse>(response);
}

export async function verifyPaystackCheckout(payload: {
  reference: string;
  orderId: string;
  orderNumber: string;
}) {
  const response = await fetch("/api/payments/paystack/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<PaystackVerifyResponse>(response);
}