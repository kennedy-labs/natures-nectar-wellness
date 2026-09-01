"use client";

import type {
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Customer information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Full name
          </label>

          <Input
            placeholder="John Doe"
            {...register("customer.name", { required: "Full name is required.", minLength: { value: 2, message: "Name must be at least 2 characters." } })}
          />

          {errors.customer?.name ? (
            <p className="text-sm text-destructive">
              {errors.customer.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Phone number
          </label>

          <Input
            placeholder="0712345678"
            {...register("customer.phone", { required: "Phone number is required.", minLength: { value: 7, message: "Phone must be at least 7 characters." } })}
          />

          {errors.customer?.phone ? (
            <p className="text-sm text-destructive">
              {errors.customer.phone.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Email address (optional)
          </label>

          <Input
            placeholder="you@example.com"
            type="email"
            {...register("customer.email")}
          />

          {errors.customer?.email ? (
            <p className="text-sm text-destructive">
              {errors.customer.email.message}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}