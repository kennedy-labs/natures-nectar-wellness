"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import type { CheckoutFormValues } from "@/features/checkout/types/checkout.types";

type CheckoutCustomerSectionProps = {
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

export function CheckoutCustomerSection({
  register,
  errors,
}: CheckoutCustomerSectionProps) {
  return (
    <section aria-labelledby="checkout-step-contact" className="space-y-5 p-5 sm:p-7">
      <div className="space-y-1">
        <p className="font-mono text-xs text-primary">01</p>
        <h2
          id="checkout-step-contact"
          className="font-display text-xl font-medium text-foreground"
        >
          Contact details
        </h2>
        <p className="text-xs text-muted-foreground">
          Used for order updates, delivery coordination, and M-Pesa verification.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="checkout-name" className="text-xs font-medium text-foreground">
            Full name *
          </label>
          <Input
            id="checkout-name"
            autoComplete="name"
            className="h-11 bg-background"
            placeholder="e.g. Grace Wanjiku"
            {...register("customer.name", {
              required: "Full name is required.",
              minLength: {
                value: 2,
                message: "Name must be at least 2 characters.",
              },
            })}
          />
          {errors.customer?.name ? (
            <p className="text-xs font-medium text-destructive">
              {errors.customer.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkout-phone" className="text-xs font-medium text-foreground">
            Phone number *
          </label>
          <Input
            id="checkout-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className="h-11 bg-background tabular-nums"
            placeholder="0712 345 678"
            {...register("customer.phone", {
              required: "Phone number is required.",
              minLength: {
                value: 7,
                message: "Phone must be at least 7 characters.",
              },
            })}
          />
          {errors.customer?.phone ? (
            <p className="text-xs font-medium text-destructive">
              {errors.customer.phone.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="checkout-email" className="text-xs font-medium text-foreground">
            Email address <span className="text-muted-foreground">(optional, for receipts)</span>
          </label>
          <Input
            id="checkout-email"
            placeholder="you@example.com"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="h-11 bg-background"
            {...register("customer.email")}
          />
          {errors.customer?.email ? (
            <p className="text-xs font-medium text-destructive">
              {errors.customer.email.message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}