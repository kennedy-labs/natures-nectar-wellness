"use client";

import { useState } from "react";
import type {
  FieldErrors,
  UseFormClearErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import {
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CheckoutFormValues,
  DeliveryMethod,
} from "@/features/checkout/types/checkout.types";
import { buildGoogleMapsPinUrl } from "@/features/orders/utils/order.utils";

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  clearErrors: UseFormClearErrors<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

const deliveryMethods: { value: DeliveryMethod; label: string }[] = [
  { value: "PICKUP", label: "Pickup (Free)" },
  { value: "LOCAL_DELIVERY", label: "Within Nairobi (Free)" },
  {
    value: "COUNTRYWIDE_DELIVERY",
    label: "Outside Nairobi (Admin confirms fee)",
  },
];

export function CheckoutDeliverySection({
  register,
  watch,
  setValue,
  clearErrors,
  errors,
}: Props) {
  const method = watch("delivery.method");
  const latitude = watch("delivery.latitude");
  const longitude = watch("delivery.longitude");
  const currentLocationText = watch("delivery.location") ?? "";

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastAutoFilledLabel, setLastAutoFilledLabel] = useState<string | null>(
    null
  );

  const requiresLocation =
    method === "LOCAL_DELIVERY" || method === "COUNTRYWIDE_DELIVERY";

  const attachedPinUrl = buildGoogleMapsPinUrl(latitude, longitude);

  function clearAttachedPin() {
    setValue("delivery.latitude", undefined, { shouldDirty: true });
    setValue("delivery.longitude", undefined, { shouldDirty: true });
    setLocationError(null);
  }

  function handleUseCurrentLocation() {
    setLocationError(null);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationError(
        "Your browser does not support automatic location. Please type your area or estate above."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setValue("delivery.latitude", lat, { shouldDirty: true });
        setValue("delivery.longitude", lng, { shouldDirty: true });

        try {
          const res = await fetch(
            `/api/location/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
          );
          const json = (await res.json().catch(() => null)) as {
            ok?: boolean;
            data?: { label?: string | null };
          } | null;

          const readableLabel = json?.ok ? json.data?.label?.trim() : null;
          if (readableLabel) {
            const trimmedExisting = currentLocationText.trim();
            if (
              !trimmedExisting ||
              trimmedExisting === lastAutoFilledLabel
            ) {
              setValue("delivery.location", readableLabel, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setLastAutoFilledLabel(readableLabel);
              clearErrors("delivery.location");
            }
          }
        } catch {
          // GPS pin coordinates remain saved even if area name lookup times out
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setLocationError(
            "Location permission was denied. Enable location access or type your delivery area manually."
          );
        } else if (geoError.code === geoError.TIMEOUT) {
          setLocationError(
            "GPS lookup timed out. Try again outdoors or type your delivery location manually."
          );
        } else {
          setLocationError(
            "Could not detect your current location. Please type your delivery area manually."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* DELIVERY METHOD */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Delivery method</label>

          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:h-10 md:text-sm"
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
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium">Delivery location</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="min-h-10 w-full gap-1.5 text-xs sm:w-auto"
              >
                {locating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Detecting GPS...
                  </>
                ) : (
                  <>
                    <LocateFixed className="h-3.5 w-3.5 text-primary" />
                    Use my current location
                  </>
                )}
              </Button>
            </div>

            <Input
              placeholder="Estate, road, building or town (e.g. Kilimani, Argwings Kodhek Rd)"
              {...register("delivery.location", {
                required: "Delivery location is required.",
                minLength: {
                  value: 3,
                  message: "Location must be at least 3 characters.",
                },
              })}
            />

            {attachedPinUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                  <span>
                    Exact GPS pin attached — add apartment/gate details above if
                    helpful.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={attachedPinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-emerald-800 underline underline-offset-2"
                  >
                    Preview pin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={clearAttachedPin}
                    aria-label="Remove GPS pin"
                    className="rounded p-0.5 text-emerald-800 hover:bg-emerald-200/60"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            {locationError ? (
              <p className="text-xs text-destructive">{locationError}</p>
            ) : null}

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
            placeholder="Any instructions for delivery (e.g. Gate code, landmark)"
            {...register("delivery.notes")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
