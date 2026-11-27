"use client";

import { useEffect, useState } from "react";
import type {
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Banknote, CheckCircle2, Smartphone } from "lucide-react";

import { Input } from "@/components/ui/input";
import type {
  CheckoutFormValues,
  GatewayAvailability,
  PaymentMethod,
} from "@/features/checkout/types/checkout.types";
import { cn } from "@/lib/utils";

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  clearErrors: UseFormClearErrors<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
  gatewayAvailability?: GatewayAvailability;
};

type PaymentOption = {
  value: Extract<PaymentMethod, "MPESA_BUY_GOODS" | "CASH_ON_PICKUP">;
  title: string;
  subtitle: string;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: "MPESA_BUY_GOODS",
    title: "M-Pesa STK Push",
    subtitle: "Instant Safaricom PIN prompt on your phone to authorize payment.",
  },
  {
    value: "CASH_ON_PICKUP",
    title: "Cash on Pickup",
    subtitle: "Pay in cash directly when collecting your order.",
  },
];

function isValidKenyanMobile(raw?: string): boolean {
  if (!raw) return false;
  const cleaned = raw.replace(/[\s\-()]/g, "");
  const digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  if (/^0[71]\d{8}$/.test(digits)) return true;
  if (/^[71]\d{8}$/.test(digits)) return true;
  if (/^254[71]\d{8}$/.test(digits)) return true;
  return false;
}

export function CheckoutPaymentSection({
  register,
  watch,
  setValue,
  clearErrors,
  errors,
  gatewayAvailability,
}: Props) {
  const selectedMethod = watch("preferredPaymentMethod");
  const customerPhone = watch("customer.phone") ?? "";
  const mpesaPhone = watch("mpesaPhone") ?? "";
  const [mpesaPhoneEdited, setMpesaPhoneEdited] = useState(false);

  const darajaEnabled = gatewayAvailability?.darajaEnabled ?? false;

  useEffect(() => {
    if (!mpesaPhoneEdited && customerPhone) {
      setValue("mpesaPhone", customerPhone, { shouldDirty: false });
      clearErrors("mpesaPhone");
    }
  }, [customerPhone, mpesaPhoneEdited, setValue, clearErrors]);

  function handleSelectMethod(value: PaymentOption["value"]) {
    setValue("preferredPaymentMethod", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("preferredPaymentMethod");

    if (value === "MPESA_BUY_GOODS" && !mpesaPhone.trim() && customerPhone) {
      setValue("mpesaPhone", customerPhone, { shouldDirty: false });
    }
  }

  return (
    <section aria-labelledby="checkout-step-payment" className="space-y-5 p-5 sm:p-7">
      <div className="space-y-1">
        <p className="font-mono text-xs text-primary">03</p>
        <h2
          id="checkout-step-payment"
          className="font-display text-xl font-medium text-foreground"
        >
          Payment method
        </h2>
        <p className="text-xs text-muted-foreground">
          Choose instant M-Pesa mobile confirmation or Cash on Pickup.
        </p>
      </div>

      <input
        type="hidden"
        {...register("preferredPaymentMethod", {
          required: "Please choose M-Pesa or Cash on Pickup.",
        })}
      />

      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid gap-3 sm:grid-cols-2"
      >
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedMethod === option.value;
          const Icon =
            option.value === "MPESA_BUY_GOODS" ? Smartphone : Banknote;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelectMethod(option.value)}
              className={cn(
                "flex min-h-[76px] items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/[0.05] ring-1 ring-primary"
                  : "border-border bg-background hover:border-primary/40"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {option.title}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {option.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {errors.preferredPaymentMethod ? (
        <p className="text-xs font-medium text-destructive">
          {errors.preferredPaymentMethod.message}
        </p>
      ) : null}

      {selectedMethod === "MPESA_BUY_GOODS" ? (
        <div className="space-y-2.5 rounded-lg border border-primary/25 bg-primary/[0.04] p-4">
          <label
            htmlFor="checkout-mpesa-phone"
            className="text-xs font-medium text-foreground"
          >
            Safaricom M-Pesa number *
          </label>

          <Input
            id="checkout-mpesa-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0712 345 678"
            disabled={!darajaEnabled}
            className="h-11 bg-background tabular-nums"
            {...register("mpesaPhone", {
              onChange: () => setMpesaPhoneEdited(true),
              validate: (val) => {
                if (watch("preferredPaymentMethod") !== "MPESA_BUY_GOODS") {
                  return true;
                }
                const candidate = (val || customerPhone || "").trim();
                if (!candidate) {
                  return "Enter the Safaricom M-Pesa phone number to receive the PIN prompt.";
                }
                if (!isValidKenyanMobile(candidate)) {
                  return "Enter a valid Kenyan M-Pesa number (e.g. 0712 345 678 or 0112 345 678).";
                }
                return true;
              },
            })}
          />

          {errors.mpesaPhone ? (
            <p className="text-xs font-medium text-destructive">
              {errors.mpesaPhone.message}
            </p>
          ) : null}

          {darajaEnabled ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your bag remains safely reserved while you enter your M-Pesa PIN.
            </p>
          ) : (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
              Online M-Pesa PIN payment is awaiting activation on this store.
              Please select <strong>Cash on Pickup</strong> to submit your order
              now.
            </div>
          )}
        </div>
      ) : null}

      {selectedMethod === "CASH_ON_PICKUP" ? (
        <div className="rounded-lg border border-border bg-background p-3.5 text-xs leading-relaxed text-muted-foreground">
          No upfront payment needed — your order submits immediately and you pay
          in cash when collecting it.
        </div>
      ) : null}
    </section>
  );
}