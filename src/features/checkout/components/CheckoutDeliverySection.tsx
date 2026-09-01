"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CheckoutFormValues,
  DeliveryMethod,
} from "@/features/checkout/types/checkout.types";

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

const deliveryMethods: { value: DeliveryMethod; label: string }[] = [
  { value: "PICKUP", label: "Pickup (Free)" },
  { value: "LOCAL_DELIVERY", label: "Local Delivery" },
  { value: "COUNTRYWIDE_DELIVERY", label: "Countrywide Delivery" },
];

export function CheckoutDeliverySection({
  register,
  watch,
  errors,
}: Props) {
  const method = watch("delivery.method");

  const requiresLocation =
    method === "LOCAL_DELIVERY" || method === "COUNTRYWIDE_DELIVERY";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* DELIVERY METHOD */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Delivery method
          </label>

          <select
            className="w-full rounded-md border p-2"
            {...register("delivery.method")}
          >
            {deliveryMethods.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {errors.delivery?.method ? (
            <p className="text-sm text-destructive">
              {errors.delivery.method.message}
            </p>
          ) : null}
        </div>

        {/* LOCATION (conditional) */}
        {requiresLocation ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Delivery location
            </label>

            <Input
              placeholder="Enter your location"
              {...register("delivery.location", { required: "Delivery location is required.", minLength: { value: 3, message: "Location must be at least 3 characters." } })}
            />

            {errors.delivery?.location ? (
              <p className="text-sm text-destructive">
                {errors.delivery.location.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* NOTES */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Delivery notes (optional)
          </label>

          <Input
            placeholder="Any instructions for delivery"
            {...register("delivery.notes")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
