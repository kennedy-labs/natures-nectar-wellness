import { readApiData } from "@/lib/api-client";

import type {
  CheckoutFormValues,
  CheckoutSubmitResponse,
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