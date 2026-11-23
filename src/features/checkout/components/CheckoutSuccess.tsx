"use client";

import Link from "next/link";
import { Banknote, CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import type {
  GatewayAvailability,
  PaymentMethod,
} from "@/features/checkout/types/checkout.types";
import { formatKes } from "@/lib/format";

type CheckoutSuccessProps = {
  orderId?: string;
  orderNumber: string;
  whatsappMessage: string;
  amount: number;
  customerPhone?: string;
  customerEmail?: string | null;
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
  preferredPaymentMethod,
  initialVerified = null,
}: CheckoutSuccessProps) {
  const whatsappUrl =
    getWhatsAppUrl(whatsappMessage) ??
    `https://wa.me/254757122299?text=${encodeURIComponent(whatsappMessage)}`;

  const isCashOnPickup = preferredPaymentMethod === "CASH_ON_PICKUP";

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-green-600">
            {initialVerified ? "Order paid & confirmed" : "Order submitted"}
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            {initialVerified ? "Payment received" : "Thank you for your order"}
          </h2>

          <p className="text-sm text-muted-foreground">
            {initialVerified
              ? "Your M-Pesa payment has been verified and your order is now queued for processing."
              : isCashOnPickup
                ? "Your order is saved. Pay in cash when collecting your order."
                : "Your order is received."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/40 p-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Order number</p>
            <p className="mt-1 font-semibold">{orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Order total</p>
            <p className="mt-1 font-semibold">{formatKes(amount)}</p>
          </div>
        </div>

        {initialVerified ? (
          <div className="space-y-2 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Verified {initialVerified.channelLabel ?? "M-Pesa"} Payment
              </span>
            </div>
            <p className="text-muted-foreground">
              Amount paid:{" "}
              <strong className="text-foreground">
                {formatKes(initialVerified.amount)}
              </strong>
            </p>
            {initialVerified.transactionRef ? (
              <p className="text-muted-foreground">
                M-Pesa receipt:{" "}
                <strong className="text-foreground">
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

        <div className="space-y-2.5 pt-2">
          <Button asChild className="w-full">
            <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
              <MessageCircle className="mr-2 h-4 w-4" />
              Continue on WhatsApp
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/orders">View my orders</Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
