"use client";

import Link from "next/link";
import { Banknote, CheckCircle2, MessageCircle } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
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
    `https://wa.me/254757122299?text=${encodeURIComponent(resolvedWhatsappMessage)}`;

  const isCashOnPickup = preferredPaymentMethod === "CASH_ON_PICKUP";

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-8">
      <WhatsAppPageContext message={resolvedWhatsappMessage} />
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">
            {initialVerified ? "Order paid & confirmed" : "Order submitted"}
          </p>

          <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {initialVerified ? "Payment received" : "Thank you for your order"}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {initialVerified
              ? "Your M-Pesa payment has been verified and your order is now queued for processing."
              : isCashOnPickup
                ? "Your order is saved. Pay in cash when collecting your order."
                : "Your order is received."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-muted/45 p-4 text-center sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Order number</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
              {orderNumber}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Order total</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatKes(amount)}
            </p>
          </div>
        </div>

        {initialVerified ? (
          <div className="space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Verified {initialVerified.channelLabel ?? "M-Pesa"} Payment
              </span>
            </div>
            <p className="text-muted-foreground">
              Amount paid:{" "}
              <strong className="text-foreground tabular-nums">
                {formatKes(initialVerified.amount)}
              </strong>
            </p>
            {initialVerified.transactionRef ? (
              <p className="text-muted-foreground">
                M-Pesa receipt:{" "}
                <strong className="font-mono text-foreground">
                  {initialVerified.transactionRef}
                </strong>
              </p>
            ) : null}
          </div>
        ) : isCashOnPickup ? (
          <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Banknote className="h-4 w-4 text-primary" />
              <span>Cash on Pickup</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              No online payment is required now. Please have{" "}
              <strong>{formatKes(amount)}</strong> ready in cash when picking up
              your order, or message us on WhatsApp to coordinate pickup timing.
            </p>
          </div>
        ) : null}

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {customerEmail
            ? `A confirmation copy is sent to ${customerEmail} when email receipts are active. `
            : ""}
          Keep your order number (<span className="font-mono">{orderNumber}</span>)
          and checkout phone number to track your order from any device.
        </p>

        <div className="space-y-2.5 pt-2">
          <Button asChild className="w-full min-h-11">
            <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
              <MessageCircle className="mr-2 h-4 w-4" />
              Continue on WhatsApp
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full min-h-11">
            <Link href="/orders">View my orders</Link>
          </Button>

          <Button asChild variant="outline" className="w-full min-h-11">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
