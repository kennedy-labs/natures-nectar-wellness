"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { ApiClientError } from "@/lib/api-client";

import { CheckoutCartSummary } from "@/features/checkout/components/CheckoutCartSummary";
import { CheckoutCustomerSection } from "@/features/checkout/components/CheckoutCustomerSection";
import { CheckoutDeliverySection } from "@/features/checkout/components/CheckoutDeliverySection";
import { CheckoutPaymentSection } from "@/features/checkout/components/CheckoutPaymentSection";
import { CheckoutSuccess } from "@/features/checkout/components/CheckoutSuccess";

import { useCheckout } from "@/features/checkout/hooks/useCheckout";

import type { CheckoutFormValues } from "@/features/checkout/types/checkout.types";

import { useCartStore } from "@/store/cart.store";

export function CheckoutForm() {
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [generalError, setGeneralError] = useState<string | null>(null);

  const { submit, result, isSubmitting, isSuccess } = useCheckout();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      customer: {
        name: "",
        phone: "",
        email: "",
      },

      delivery: {
        method: "PICKUP",
        location: "",
        notes: "",
      },

      preferredPaymentMethod: undefined,
      customerNotes: "",
    },
  });

  async function onSubmit(values: CheckoutFormValues) {
    clearErrors();
    setGeneralError(null);

    try {
      const response = await submit(values, cartItems);

      clearCart();

      return response;
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "VALIDATION_ERROR" &&
        error.issues
      ) {
        for (const issue of error.issues) {
          const field = issue.path.join(".") as keyof CheckoutFormValues;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setError(field as any, {
            type: "server",
            message: issue.message,
          });
        }

        return;
      }

      setGeneralError(
        error instanceof Error
          ? error.message
          : "Failed to submit order."
      );
    }
  }

  if (isSuccess && result) {
    return (
      <CheckoutSuccess
        orderNumber={result.orderNumber}
        whatsappMessage={result.whatsappMessage}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-6">
        <CheckoutCustomerSection
          register={register}
          errors={errors}
        />

        <CheckoutDeliverySection
          register={register}
          watch={watch}
          errors={errors}
        />

        <CheckoutPaymentSection
          register={register}
          errors={errors}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Additional notes (optional)
          </label>

          <textarea
            className="min-h-[120px] w-full rounded-md border p-3"
            placeholder="Add any extra information about your order"
            {...register("customerNotes")}
          />
        </div>

        {generalError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {generalError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || cartItems.length === 0}
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting order..." : "Place order"}
        </button>
      </div>

      <div>
        <CheckoutCartSummary />
      </div>
    </form>
  );
}