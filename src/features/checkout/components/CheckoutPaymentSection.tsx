"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CheckoutFormValues,
  PaymentMethod,
} from "@/features/checkout/types/checkout.types";

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "MPESA_BUY_GOODS", label: "M-Pesa Buy Goods" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH_ON_PICKUP", label: "Cash on Pickup" },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
];

export function CheckoutPaymentSection({ register, errors }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment preference</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Select preferred payment method
          </label>

          <select
            className="w-full rounded-md border p-2"
            {...register("preferredPaymentMethod", {
              setValueAs: (v) => (v === "" ? undefined : v),
            })}
          >
            <option value="">Select option</option>

            {paymentMethods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {errors.preferredPaymentMethod ? (
            <p className="text-sm text-destructive">
              {errors.preferredPaymentMethod.message}
            </p>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Payment will be confirmed after order review. No payment is processed at checkout.
        </p>
      </CardContent>
    </Card>
  );
}