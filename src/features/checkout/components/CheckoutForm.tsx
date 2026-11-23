"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { ApiClientError } from "@/lib/api-client";

import { verifyPaystackCheckout } from "@/features/checkout/api/checkout-api";
import { CheckoutCartSummary } from "@/features/checkout/components/CheckoutCartSummary";
import { CheckoutCustomerSection } from "@/features/checkout/components/CheckoutCustomerSection";
import { CheckoutDeliverySection } from "@/features/checkout/components/CheckoutDeliverySection";
import { CheckoutPaymentSection } from "@/features/checkout/components/CheckoutPaymentSection";
import { CheckoutSuccess } from "@/features/checkout/components/CheckoutSuccess";

import { useCheckout } from "@/features/checkout/hooks/useCheckout";

import type {
  CheckoutFormValues,
  GatewayAvailability,
  PaystackReturnParams,
  PaystackVerifyResponse,
} from "@/features/checkout/types/checkout.types";

import { useCartStore } from "@/store/cart.store";

type CheckoutFormProps = {
  gatewayAvailability?: GatewayAvailability;
  initialPaystackReturn?: PaystackReturnParams | null;
};

export function CheckoutForm({
  gatewayAvailability,
  initialPaystackReturn = null,
}: CheckoutFormProps) {
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedMpesaPhone, setSubmittedMpesaPhone] = useState<string>("");
  const [verifyingPaystack, setVerifyingPaystack] = useState(
    Boolean(initialPaystackReturn)
  );
  const [paystackVerified, setPaystackVerified] =
    useState<PaystackVerifyResponse | null>(null);

  const { submit, result, isSubmitting, isSuccess } = useCheckout();

  useEffect(() => {
    if (!initialPaystackReturn) {
      return;
    }

    let cancelled = false;

    verifyPaystackCheckout(initialPaystackReturn)
      .then((verified) => {
        if (cancelled) return;
        setPaystackVerified(verified);
        clearCart();
      })
      .catch((error) => {
        if (cancelled) return;
        setGeneralError(
          error instanceof Error
            ? error.message
            : "Could not verify Paystack payment."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setVerifyingPaystack(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialPaystackReturn, clearCart]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
        latitude: undefined,
        longitude: undefined,
      },

      preferredPaymentMethod: undefined,
      mpesaPhone: "",
      customerNotes: "",
    },
  });

  const selectedPaymentMethod = watch("preferredPaymentMethod");

  async function onSubmit(values: CheckoutFormValues) {
    clearErrors();
    setGeneralError(null);

    const chosenMpesaPhone = (
      values.mpesaPhone ||
      values.customer.phone ||
      ""
    ).trim();
    setSubmittedMpesaPhone(chosenMpesaPhone);

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
        error instanceof Error ? error.message : "Failed to submit order."
      );
    }
  }

  if (verifyingPaystack) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border bg-card p-10 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Verifying your Paystack payment...</span>
      </div>
    );
  }

  if (paystackVerified) {
    return (
      <CheckoutSuccess
        orderId={initialPaystackReturn?.orderId}
        orderNumber={paystackVerified.orderNumber}
        whatsappMessage={paystackVerified.whatsappMessage}
        amount={paystackVerified.amount}
        gatewayAvailability={gatewayAvailability}
        initialVerified={{
          transactionRef: paystackVerified.transactionRef,
          amount: paystackVerified.amount,
          channelLabel: "Paystack",
        }}
      />
    );
  }

  if (isSuccess && result) {
    const shouldAutoStartMpesa =
      result.preferredPaymentMethod === "MPESA_BUY_GOODS" &&
      Boolean(gatewayAvailability?.darajaEnabled);

    return (
      <CheckoutSuccess
        orderId={result.id}
        orderNumber={result.orderNumber}
        whatsappMessage={result.whatsappMessage}
        amount={result.totalAmount ?? result.subtotalAmount}
        customerPhone={result.customerPhone}
        mpesaPhone={submittedMpesaPhone || result.customerPhone}
        autoStartMpesa={shouldAutoStartMpesa}
        customerEmail={result.customerEmail}
        preferredPaymentMethod={result.preferredPaymentMethod}
        gatewayAvailability={gatewayAvailability}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-6">
        <CheckoutCustomerSection register={register} errors={errors} />

        <CheckoutDeliverySection
          register={register}
          watch={watch}
          setValue={setValue}
          clearErrors={clearErrors}
          errors={errors}
        />

        <CheckoutPaymentSection
          register={register}
          watch={watch}
          setValue={setValue}
          clearErrors={clearErrors}
          errors={errors}
          gatewayAvailability={gatewayAvailability}
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
          {isSubmitting
            ? selectedPaymentMethod === "MPESA_BUY_GOODS" &&
              gatewayAvailability?.darajaEnabled
              ? "Placing order & opening M-Pesa..."
              : "Submitting order..."
            : selectedPaymentMethod === "MPESA_BUY_GOODS"
              ? "Place Order & Pay with M-Pesa"
              : "Place order"}
        </button>
      </div>

      <div>
        <CheckoutCartSummary />
      </div>
    </form>
  );
}