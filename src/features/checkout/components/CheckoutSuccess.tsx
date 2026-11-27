"use client";

import Link from "next/link";
import { Banknote, CheckCircle2, ExternalLink, MapPin, MessageCircle } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import { BUSINESS_LOCATION } from "@/config/site";
import type {
  DeliveryMethod,
  GatewayAvailability,
  PaymentMethod,
} from "@/features/checkout/types/checkout.types";
import { createMinimalOrderWhatsappMessage } from "@/features/whatsapp/utils/whatsapp.utils";
import { formatKes } from "@/lib/format";

type CheckoutSuccessProps = {
  orderId?: string;
  orderNumber: string;
  whatsappMessage: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string | null;
  deliveryMethod?: DeliveryMethod;
  deliveryLocation?: string | null;
  preferredPaymentMethod?: PaymentMethod | null;
  gatewayAvailability?: GatewayAvailability;
  initialVerified?: {
    transactionRef: string | null;
    amount: number;
    channelLabel?: string;
  } | null;
};

export function CheckoutSuccess({
  orderNumber,
  whatsappMessage,
  amount,
  customerName,
  customerEmail,
  deliveryMethod,
  deliveryLocation,
  preferredPaymentMethod,
  initialVerified = null,
}: CheckoutSuccessProps) {
  const resolvedWhatsappMessage =
    customerName || deliveryMethod
      ? createMinimalOrderWhatsappMessage({
          orderNumber,
          customerName,
          deliveryMethod,
          deliveryLocation,
          preferredPaymentMethod,
          paymentStatus: initialVerified ? "VERIFIED" : undefined,
          isPaid: Boolean(initialVerified),
        })
      : whatsappMessage;

  const whatsappUrl =
    getWhatsAppUrl(resolvedWhatsappMessage) ??
    `https://wa.me/${BUSINESS_LOCATION.phoneDigits}?text=${encodeURIComponent(resolvedWhatsappMessage)}`;

  const isCashOnPickup = preferredPaymentMethod === "CASH_ON_PICKUP";

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 sm:p-8">
      <WhatsAppPageContext message={resolvedWhatsappMessage} />
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {initialVerified ? "Order paid & confirmed" : "Order recorded"}
          </p>

          <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {initialVerified ? "Payment received" : "Thank you for your order"}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {initialVerified
              ? "Your M-Pesa payment has been verified and your order is queued for preparation."
              : isCashOnPickup
                ? "Your order is confirmed. Settle in cash when collecting your items."
                : "Your order has been received."}
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-background text-center">
          <div className="min-w-0 p-4">
            <p className="text-xs text-muted-foreground">Order number</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
              {orderNumber}
            </p>
          </div>
          <div className="min-w-0 p-4">
            <p className="text-xs text-muted-foreground">Order total</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatKes(amount)}
            </p>
          </div>
        </div>

        {initialVerified ? (
          <div className="space-y-1.5 rounded-lg border border-primary/25 bg-primary/[0.04] p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Verified {initialVerified.channelLabel ?? "M-Pesa"} Receipt
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Amount paid:{" "}
              <strong className="text-foreground tabular-nums">
                {formatKes(initialVerified.amount)}
              </strong>
              {initialVerified.transactionRef ? (
                <>
                  {" · "}Ref:{" "}
                  <strong className="font-mono text-foreground">
                    {initialVerified.transactionRef}
                  </strong>
                </>
              ) : null}
            </p>
          </div>
        ) : isCashOnPickup ? (
          <div className="space-y-1.5 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Banknote className="h-4 w-4 text-primary" />
              <span>Cash on Pickup</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Please have <strong className="tabular-nums text-foreground">{formatKes(amount)}</strong> ready when collecting your order.
            </p>
          </div>
        ) : null}

        {deliveryMethod === "PICKUP" ? (
          <div className="space-y-1.5 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>Pickup Location</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {BUSINESS_LOCATION.fullAddress} · Tel:{" "}
              <a
                href={BUSINESS_LOCATION.phoneHref}
                className="font-medium text-foreground tabular-nums underline-offset-4 hover:underline"
              >
                {BUSINESS_LOCATION.phoneDisplay}
              </a>
            </p>
            <a
              href={BUSINESS_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Get directions on Google Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {customerEmail
            ? `A confirmation copy is sent to ${customerEmail} when email receipts are active. `
            : ""}
          Keep <span className="font-mono font-medium text-foreground">{orderNumber}</span>{" "}
          and your phone number to check live progress anytime.
        </p>

        <div className="space-y-2.5 border-t border-border pt-4">
          <Button asChild className="min-h-11 w-full">
            <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
              <MessageCircle className="mr-2 h-4 w-4" />
              Coordinate on WhatsApp
            </a>
          </Button>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="min-h-10 w-full bg-background">
              <Link href="/orders">View my orders</Link>
            </Button>

            <Button asChild variant="outline" className="min-h-10 w-full bg-background">
              <Link href="/products">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
