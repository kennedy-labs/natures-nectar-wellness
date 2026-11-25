"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";

import { verifyPaystackCheckout } from "@/features/checkout/api/checkout-api";
import { CheckoutCartSummary } from "@/features/checkout/components/CheckoutCartSummary";
import { CheckoutCustomerSection } from "@/features/checkout/components/CheckoutCustomerSection";
import { CheckoutDeliverySection } from "@/features/checkout/components/CheckoutDeliverySection";
import { CheckoutPaymentSection } from "@/features/checkout/components/CheckoutPaymentSection";
import { CheckoutSuccess } from "@/features/checkout/components/CheckoutSuccess";
import { MpesaPaymentGate } from "@/features/checkout/components/MpesaPaymentGate";

import { useCheckout } from "@/features/checkout/hooks/useCheckout";

import type {
  CheckoutFormValues,
  GatewayAvailability,
  PaystackReturnParams,
  PaystackVerifyResponse,
} from "@/features/checkout/types/checkout.types";

import { useCartStore } from "@/store/cart.store";
import { useOrdersStore } from "@/store/orders.store";

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
  const saveOrderRef = useOrdersStore((state) => state.saveOrderRef);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedMpesaPhone, setSubmittedMpesaPhone] = useState<string>("");
  const [verifiedMpesaReceipt, setVerifiedMpesaReceipt] = useState<{
    transactionRef: string | null;
    amount: number;
    channelLabel?: string;
  } | null>(null);
  const [verifyingPaystack, setVerifyingPaystack] = useState(
    Boolean(initialPaystackReturn)
  );
  const [paystackVerified, setPaystackVerified] =
    useState<PaystackVerifyResponse | null>(null);

  const { submit, reset, result, isSubmitting, isSuccess } = useCheckout();

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
  const selectedDeliveryMethod = watch("delivery.method");
  const mpesaBlockedWithoutDaraja =
    selectedPaymentMethod === "MPESA_BUY_GOODS" &&
    !gatewayAvailability?.darajaEnabled;

  async function onSubmit(values: CheckoutFormValues) {
    clearErrors();
    setGeneralError(null);
    setVerifiedMpesaReceipt(null);

    if (
      values.preferredPaymentMethod === "MPESA_BUY_GOODS" &&
      !gatewayAvailability?.darajaEnabled
    ) {
      setGeneralError(
        "Online M-Pesa payment is not activated yet on this store. Please choose Cash on Pickup to place your order now."
      );
      return;
    }

    const chosenMpesaPhone = (
      values.mpesaPhone ||
      values.customer.phone ||
      ""
    ).trim();
    setSubmittedMpesaPhone(chosenMpesaPhone);

    try {
      const response = await submit(values, cartItems);

      // Only clear cart and record order immediately for Cash on Pickup; M-Pesa waits until Safaricom verifies payment.
      if (response.preferredPaymentMethod !== "MPESA_BUY_GOODS") {
        clearCart();
        saveOrderRef({
          orderNumber: response.orderNumber,
          phone: response.customerPhone,
        });
      }

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
      <div className="space-y-4 rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying your Paystack payment...</span>
        </div>
        <div className="space-y-3 border-t pt-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
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
    if (
      result.preferredPaymentMethod === "MPESA_BUY_GOODS" &&
      !verifiedMpesaReceipt
    ) {
      return (
        <MpesaPaymentGate
          orderId={result.id}
          orderNumber={result.orderNumber}
          amount={result.totalAmount ?? result.subtotalAmount}
          initialPhone={submittedMpesaPhone || result.customerPhone}
          darajaEnv={gatewayAvailability?.darajaEnv}
          onVerified={(receipt) => {
            clearCart();
            saveOrderRef({
              orderNumber: result.orderNumber,
              phone: result.customerPhone,
            });
            setVerifiedMpesaReceipt({
              transactionRef: receipt.transactionRef,
              amount: receipt.amount,
              channelLabel: "M-Pesa",
            });
          }}
          onCancelBack={() => {
            setVerifiedMpesaReceipt(null);
            reset();
          }}
        />
      );
    }

    return (
      <CheckoutSuccess
        orderId={result.id}
        orderNumber={result.orderNumber}
        whatsappMessage={result.whatsappMessage}
        amount={result.totalAmount ?? result.subtotalAmount}
        customerPhone={result.customerPhone}
        customerEmail={result.customerEmail}
        preferredPaymentMethod={result.preferredPaymentMethod}
        initialVerified={verifiedMpesaReceipt}
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
            className="min-h-[120px] w-full rounded-md border border-input bg-card p-3 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
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
          disabled={
            isSubmitting || cartItems.length === 0 || mpesaBlockedWithoutDaraja
          }
          className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-base font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        >
          {mpesaBlockedWithoutDaraja
            ? "Select Cash on Pickup (M-Pesa awaiting activation)"
            : isSubmitting
              ? selectedPaymentMethod === "MPESA_BUY_GOODS"
                ? "Opening M-Pesa payment..."
                : "Submitting order..."
              : selectedPaymentMethod === "MPESA_BUY_GOODS"
                ? "Pay with M-Pesa & Place Order"
                : "Place order"}
        </button>
      </div>

      <div className="order-first lg:order-last">
        <CheckoutCartSummary deliveryMethod={selectedDeliveryMethod} />
      </div>
    </form>
  );
}