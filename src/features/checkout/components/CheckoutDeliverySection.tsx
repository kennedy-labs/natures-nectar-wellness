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
  CheckCircle2,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Store,
  Truck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BUSINESS_LOCATION } from "@/config/site";
import type {
  CheckoutFormValues,
  DeliveryMethod,
} from "@/features/checkout/types/checkout.types";
import { buildGoogleMapsPinUrl } from "@/features/orders/utils/order.utils";
import { cn } from "@/lib/utils";

type Props = {
  register: UseFormRegister<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  clearErrors: UseFormClearErrors<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
};

const DELIVERY_OPTIONS: {
  value: DeliveryMethod;
  title: string;
  feeTag: string;
  description: string;
  icon: typeof Store;
}[] = [
  {
    value: "PICKUP",
    title: "Shop Pickup",
    feeTag: "Free",
    description: "Collect directly from Kooni Mall, Tsavo Street, Nairobi.",
    icon: Store,
  },
  {
    value: "LOCAL_DELIVERY",
    title: "Within Nairobi",
    feeTag: "Free",
    description: "Same/next-day local drop-off once location is confirmed.",
    icon: Truck,
  },
  {
    value: "COUNTRYWIDE_DELIVERY",
    title: "Outside Nairobi",
    feeTag: "Quoted first",
    description: "Courier fee confirmed via WhatsApp before dispatch.",
    icon: MapPin,
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

  function selectDeliveryMethod(nextMethod: DeliveryMethod) {
    setValue("delivery.method", nextMethod, {
      shouldDirty: true,
      shouldValidate: true,
    });
    clearErrors("delivery.method");
    if (nextMethod === "PICKUP") {
      clearErrors("delivery.location");
    }
  }

  function clearAttachedPin() {
    setValue("delivery.latitude", undefined, { shouldDirty: true });
    setValue("delivery.longitude", undefined, { shouldDirty: true });
    setLocationError(null);
  }

  function handleUseCurrentLocation() {
    setLocationError(null);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationError(
        "Your browser does not support automatic location. Please type your area or estate below."
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
          // GPS coordinates remain saved even if area lookup times out
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
    <section aria-labelledby="checkout-step-delivery" className="space-y-5 p-5 sm:p-7">
      <div className="space-y-1">
        <p className="font-mono text-xs text-primary">02</p>
        <h2
          id="checkout-step-delivery"
          className="font-display text-xl font-medium text-foreground"
        >
          Delivery &amp; location
        </h2>
        <p className="text-xs text-muted-foreground">
          Zero surprise fees — pickup and Nairobi delivery are free; countrywide
          courier rates are confirmed before dispatch.
        </p>
      </div>

      <input type="hidden" {...register("delivery.method")} />

      <div
        role="radiogroup"
        aria-label="Delivery method"
        className="grid gap-3 sm:grid-cols-3"
      >
        {DELIVERY_OPTIONS.map((opt) => {
          const isSelected = method === opt.value;
          const Icon = opt.icon;

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => selectDeliveryMethod(opt.value)}
              className={cn(
                "flex flex-col justify-between gap-2.5 rounded-lg border p-3.5 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/[0.05] ring-1 ring-primary"
                  : "border-border bg-background hover:border-primary/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {isSelected ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : null}
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {opt.title}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      opt.feeTag === "Free"
                        ? "text-primary"
                        : "text-amber-700"
                    )}
                  >
                    {opt.feeTag}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!requiresLocation ? (
        <div className="space-y-2 rounded-lg border border-border bg-background p-4 text-sm">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-foreground">
                Pickup Location: {BUSINESS_LOCATION.fullAddress}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                We&apos;ll notify you once your order is packed. Call{" "}
                <a
                  href={BUSINESS_LOCATION.phoneHref}
                  className="font-medium text-foreground tabular-nums underline-offset-4 hover:underline"
                >
                  {BUSINESS_LOCATION.phoneDisplay}
                </a>{" "}
                or open directions below.
              </p>
              <a
                href={BUSINESS_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                View shop on Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="checkout-delivery-location"
              className="text-xs font-medium text-foreground"
            >
              Delivery location *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="min-h-9 w-full gap-1.5 bg-background text-xs sm:w-auto"
            >
              {locating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Detecting GPS...
                </>
              ) : (
                <>
                  <LocateFixed className="h-3.5 w-3.5 text-primary" />
                  Attach current GPS pin
                </>
              )}
            </Button>
          </div>

          <Input
            id="checkout-delivery-location"
            className="h-11 bg-background"
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/75 px-3 py-2 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
                <span>
                  GPS pin attached — add apartment/gate instructions below if
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
            <p className="text-xs font-medium text-destructive">
              {errors.delivery.location.message}
            </p>
          ) : null}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="checkout-delivery-notes"
          className="text-xs font-medium text-foreground"
        >
          Delivery instructions <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="checkout-delivery-notes"
          className="h-11 bg-background"
          placeholder="Gate code, estate landmark, or preferred pickup time"
          {...register("delivery.notes")}
        />
      </div>
    </section>
  );
}
