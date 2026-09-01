"use client";

import { useState } from "react";

import { submitCheckout } from "@/features/checkout/services/checkout-client.service";

import type {
  CheckoutFormValues,
  CheckoutSubmitResponse,
  CheckoutSubmissionState,
} from "@/features/checkout/types/checkout.types";

import type { CartItem } from "@/store/cart.store";

export function useCheckout() {
  const [state, setState] =
    useState<CheckoutSubmissionState>("idle");

  const [result, setResult] =
    useState<CheckoutSubmitResponse | null>(null);

  async function submit(
    values: CheckoutFormValues,
    cartItems: CartItem[]
  ) {
    setState("submitting");

    try {
      const response = await submitCheckout(values, cartItems);

      setResult(response);

      setState("success");

      return response;
    } catch (error) {
      setState("error");

      throw error;
    }
  }

  function reset() {
    setState("idle");
    setResult(null);
  }

  return {
    state,
    result,
    submit,
    reset,
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
  };
}