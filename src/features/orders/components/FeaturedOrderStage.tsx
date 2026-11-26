"use client";

import Link from "next/link";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import type { PaymentMethod } from "@/features/checkout/types/checkout.types";
import {
  getDeliveryFeeSummary,
  getDeliveryMethodLabel,
} from "@/features/orders/utils/order.utils";
import {
  createCancelledOrderRefundWhatsappMessage,
  createMinimalOrderWhatsappMessage,
} from "@/features/whatsapp/utils/whatsapp.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  getOrderVisualProfile,
  getProgressIndex,
  getTrackingStepsForMethod,
  isCustomerCancellable,
  isOrderClosed,
} from "./order-visual-tone";

export type CustomerOrderRecord = {
  id: string;
  orderNumber: string;
  customerName?: string;
  status: string;
  createdAt: string;
  deliveryMethod: string;
  deliveryLocation: string | null;
  deliveryFee: number | null;
  deliveryQuoteNotes: string | null;
  subtotalAmount: number;
  totalAmount: number;
  preferredPaymentMethod: PaymentMethod | null;
  whatsappMessage: string;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    quantity: number;
    priceAtPurchase: number;
    lineTotal: number;
  }>;
  payment: {
    status: string;
    method: string;
    amount: number | null;
  } | null;
};

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function renderHeaderStatusIcon(
  status: string,
  tone: "delivered" | "active" | "amber" | "alert",
  className: string
) {
  if (tone === "alert") return <XCircle className={className} />;
  if (tone === "delivered") return <CheckCircle2 className={className} />;
  if (tone === "amber") return <Clock className={className} />;
  if (status === "OUT_FOR_DELIVERY") return <Truck className={className} />;
  if (status === "PROCESSING") return <Package className={className} />;
  return <CheckCircle2 className={className} />;
}

type FeaturedOrderStageProps = {
  order: CustomerOrderRecord;
  onRequestCancel?: (order: CustomerOrderRecord) => void;
  onRemoveClosedOrder?: (order: CustomerOrderRecord) => void;
};

export function FeaturedOrderStage({
  order,
  onRequestCancel,
  onRemoveClosedOrder,
}: FeaturedOrderStageProps) {
  const isPaid = order.payment?.status === "VERIFIED";
  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";
  const canCancel = isCustomerCancellable(order.status);
  const canRemoveClosed = isOrderClosed(order.status);
  const isDispatched = order.status === "OUT_FOR_DELIVERY";
  const progressIndex = getProgressIndex(order.status);
  const trackingSteps = getTrackingStepsForMethod(order.deliveryMethod);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const profile = getOrderVisualProfile({
    status: order.status,
    deliveryMethod: order.deliveryMethod,
    deliveryFee: order.deliveryFee,
    preferredPaymentMethod: order.preferredPaymentMethod,
    paymentStatus: order.payment?.status,
  });

  const orderWhatsappMessage =
    isCancelled && isPaid
      ? createCancelledOrderRefundWhatsappMessage({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
        })
      : createMinimalOrderWhatsappMessage({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          deliveryMethod: order.deliveryMethod,
          deliveryLocation: order.deliveryLocation,
          paymentStatus: order.payment?.status,
          preferredPaymentMethod: order.preferredPaymentMethod,
          isPaid,
        });

  const whatsappUrl =
    getWhatsAppUrl(orderWhatsappMessage) ??
    `https://wa.me/254757122299?text=${encodeURIComponent(orderWhatsappMessage)}`;

  const progressWidthPercent = (progressIndex / (trackingSteps.length - 1)) * 100;

  return (
    <section
      id="featured-order-stage"
      aria-label={`Order ${order.orderNumber} details`}
      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_3px_rgba(24,42,32,0.05)] transition-opacity duration-200"
    >
      {/* Semantic Status Header Band */}
      <div
        className={cn(
          "flex flex-col justify-between gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6",
          profile.headerSurfaceClass,
          profile.headerBorderClass
        )}
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5">
            {renderHeaderStatusIcon(
              order.status,
              profile.tone,
              cn("h-5 w-5 shrink-0", profile.headerIconClass)
            )}
            <h2
              className={cn(
                "font-display text-xl font-medium tracking-tight sm:text-2xl",
                profile.headerTitleClass
              )}
            >
              {profile.statusLabel}
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-foreground/80">
            {profile.statusDescription}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">
              {order.orderNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatOrderDate(order.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-baseline justify-between gap-4 border-t border-black/5 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">Order total</p>
            <p className="font-display text-2xl font-medium tracking-tight tabular-nums text-foreground">
              {formatKes(order.totalAmount)}
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              profile.paymentTextClass
            )}
          >
            {profile.paymentPaid ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : order.payment?.status === "FAILED" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            ) : order.preferredPaymentMethod === "CASH_ON_PICKUP" ? (
              <Banknote className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{profile.paymentLabel}</span>
          </div>
        </div>
      </div>

      {/* Connected Fulfillment Progress Stepper */}
      <div className="border-b border-border/70 px-5 py-6 sm:px-7">
        {isCancelled ? (
          <div className="flex items-start gap-3 text-sm text-destructive">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">
                Fulfillment stopped — Order cancelled
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isPaid
                  ? "Your M-Pesa payment is verified and eligible for a refund. Message us on WhatsApp with order number "
                  : "If you need help or want to reorder, reach out on WhatsApp with order number "}
                <span className="font-mono font-medium text-foreground">
                  {order.orderNumber}
                </span>
                .
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Connected Horizontal Stepper */}
            <div className="relative hidden sm:block">
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 bg-border"
              >
                <div
                  className={cn(
                    "h-full transition-all duration-200",
                    profile.stepperAccentTone === "amber" && progressIndex === 0
                      ? "bg-amber-500"
                      : "bg-primary"
                  )}
                  style={{ width: `${progressWidthPercent}%` }}
                />
              </div>

              <ol className="relative grid grid-cols-4 gap-3">
                {trackingSteps.map((step, index) => {
                  const isCompleted =
                    isDelivered || index < progressIndex;
                  const isCurrent = !isDelivered && index === progressIndex;
                  const isAmberCurrent =
                    isCurrent && profile.stepperAccentTone === "amber";

                  return (
                    <li
                      key={step.key}
                      className="flex flex-col items-center text-center"
                    >
                      <span
                        className={cn(
                          "relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                          isCompleted &&
                            "bg-primary text-primary-foreground shadow-xs",
                          isCurrent &&
                            !isAmberCurrent &&
                            "border-2 border-primary bg-card text-primary ring-4 ring-primary/15",
                          isAmberCurrent &&
                            "border-2 border-amber-600 bg-amber-50 text-amber-800 ring-4 ring-amber-500/15",
                          !isCompleted &&
                            !isCurrent &&
                            "border border-border bg-card text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : isAmberCurrent ? (
                          <Clock className="h-3.5 w-3.5" />
                        ) : (
                          <span className="tabular-nums">{index + 1}</span>
                        )}
                      </span>

                      <span
                        className={cn(
                          "mt-2.5 text-xs font-medium",
                          isCompleted || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>

                      <span
                        className={cn(
                          "mt-0.5 text-[11px]",
                          isAmberCurrent
                            ? "font-medium text-amber-800"
                            : isCurrent
                              ? "font-medium text-primary"
                              : "text-muted-foreground"
                        )}
                      >
                        {isCompleted
                          ? "Completed"
                          : isAmberCurrent
                            ? "Pending payment"
                            : isCurrent
                              ? "Current step"
                              : "Upcoming"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Mobile Connected Vertical Rail Stepper */}
            <ol className="space-y-0 sm:hidden">
              {trackingSteps.map((step, index) => {
                const isLast = index === trackingSteps.length - 1;
                const isCompleted = isDelivered || index < progressIndex;
                const isCurrent = !isDelivered && index === progressIndex;
                const isAmberCurrent =
                  isCurrent && profile.stepperAccentTone === "amber";

                return (
                  <li key={step.key} className="relative flex gap-3.5 pb-4 last:pb-0">
                    {!isLast ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute bottom-0 left-3.5 top-7 w-0.5 -translate-x-1/2",
                          isCompleted ? "bg-primary" : "bg-border"
                        )}
                      />
                    ) : null}

                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                        isCompleted && "bg-primary text-primary-foreground",
                        isCurrent &&
                          !isAmberCurrent &&
                          "border-2 border-primary bg-card text-primary ring-4 ring-primary/15",
                        isAmberCurrent &&
                          "border-2 border-amber-600 bg-amber-50 text-amber-800 ring-4 ring-amber-500/15",
                        !isCompleted &&
                          !isCurrent &&
                          "border border-border bg-card text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isAmberCurrent ? (
                        <Clock className="h-3.5 w-3.5" />
                      ) : (
                        <span className="tabular-nums">{index + 1}</span>
                      )}
                    </span>

                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-1">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCompleted || isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-xs",
                          isAmberCurrent
                            ? "font-medium text-amber-800"
                            : isCurrent
                              ? "font-medium text-primary"
                              : "text-muted-foreground"
                        )}
                      >
                        {isCompleted
                          ? "Done"
                          : isAmberCurrent
                            ? "Pending payment"
                            : isCurrent
                              ? "Current"
                              : "Upcoming"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {/* Open Hairline-Divided Details Body */}
      <div className="grid divide-y divide-border/70 md:grid-cols-12 md:divide-x md:divide-y-0">
        {/* Left: Ordered Items & Receipt Summary */}
        <div className="flex flex-col justify-between p-5 sm:p-7 md:col-span-7">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3">
              <h3 className="text-sm font-semibold text-foreground">
                Ordered items
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {itemCount} {itemCount === 1 ? "unit" : "units"}
              </span>
            </div>

            <ul className="divide-y divide-border/60">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-1"
                >
                  <div className="min-w-0 space-y-0.5">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {item.quantity} × {formatKes(item.priceAtPurchase)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatKes(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 space-y-2 border-t border-border/70 pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums text-foreground">
                {formatKes(order.subtotalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span
                className={cn(
                  "tabular-nums",
                  order.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
                    order.deliveryFee === null
                    ? "font-medium text-amber-800"
                    : "text-foreground"
                )}
              >
                {getDeliveryFeeSummary(
                  order.deliveryMethod,
                  order.deliveryFee
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2.5 text-base font-semibold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">
                {formatKes(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Delivery, Payment & Support Action */}
        <div className="flex flex-col justify-between gap-6 bg-muted/20 p-5 sm:p-7 md:col-span-5">
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">
              Delivery &amp; payment
            </h3>

            <dl className="space-y-4 text-sm">
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">
                  Delivery method
                </dt>
                <dd className="font-medium text-foreground">
                  {getDeliveryMethodLabel(order.deliveryMethod)}
                </dd>
                {order.deliveryLocation ? (
                  <dd className="flex items-start gap-1.5 pt-0.5 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{order.deliveryLocation}</span>
                  </dd>
                ) : null}
                {order.deliveryQuoteNotes ? (
                  <dd className="pt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Note: {order.deliveryQuoteNotes}
                  </dd>
                ) : null}
              </div>

              <div className="space-y-1 border-t border-border/60 pt-4">
                <dt className="text-xs text-muted-foreground">Payment</dt>
                <dd
                  className={cn(
                    "flex items-center gap-2 font-medium",
                    profile.paymentTextClass
                  )}
                >
                  {profile.paymentPaid ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : order.payment?.status === "FAILED" ? (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  ) : order.preferredPaymentMethod === "CASH_ON_PICKUP" ? (
                    <Banknote className="h-4 w-4 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0" />
                  )}
                  <span>{profile.paymentLabel}</span>
                </dd>
                {order.customerName ? (
                  <dd className="text-xs text-muted-foreground">
                    Placed by {order.customerName}
                  </dd>
                ) : null}
              </div>
            </dl>
          </div>

          <div className="space-y-2.5 border-t border-border/60 pt-4">
            <Button asChild variant="outline" className="min-h-11 w-full">
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                {isCancelled && isPaid
                  ? "Request M-Pesa refund on WhatsApp"
                  : "Ask about this order"}
              </a>
            </Button>

            {canCancel && onRequestCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onRequestCancel(order)}
                className="min-h-11 w-full border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel order
              </Button>
            ) : null}

            {isDispatched ? (
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {order.deliveryMethod === "PICKUP"
                  ? "Already packed for pickup — message us on WhatsApp for changes."
                  : "Already out for delivery — message us on WhatsApp for urgent changes."}
              </p>
            ) : null}

            {canRemoveClosed && onRemoveClosedOrder ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemoveClosedOrder(order)}
                className="min-h-10 w-full text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove from this device
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
