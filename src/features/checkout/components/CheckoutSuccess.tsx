"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  initiateMpesaStk,
  initializePaystackCheckout,
  pollMpesaPaymentStatus,
} from "@/features/checkout/api/checkout-api";
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
  orderId,
  orderNumber,
  whatsappMessage,
  amount,
  customerPhone = "",
  customerEmail,
  preferredPaymentMethod,
  gatewayAvailability,
  initialVerified = null,
}: CheckoutSuccessProps) {
  const [phone, setPhone] = useState(customerPhone);
  const [stkSending, setStkSending] = useState(false);
  const [stkPolling, setStkPolling] = useState(false);
  const [stkError, setStkError] = useState<string | null>(null);
  const [stkInfo, setStkInfo] = useState<string | null>(null);

  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);

  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    transactionRef: string | null;
    amount: number;
    channelLabel?: string;
  } | null>(initialVerified);

  const whatsappUrl =
    getWhatsAppUrl(whatsappMessage) ??
    `https://wa.me/254757122299?text=${encodeURIComponent(whatsappMessage)}`;

  const isCashOnFulfillment =
    preferredPaymentMethod === "CASH_ON_PICKUP" ||
    preferredPaymentMethod === "CASH_ON_DELIVERY";

  const darajaEnabled = gatewayAvailability?.darajaEnabled ?? false;
  const paystackEnabled = gatewayAvailability?.paystackEnabled ?? false;

  useEffect(() => {
    if (!stkPolling || !orderId || verifiedReceipt) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await pollMpesaPaymentStatus({ orderId, orderNumber });
        if (cancelled) return;

        if (res.paymentStatus === "VERIFIED") {
          setVerifiedReceipt({
            transactionRef: res.transactionRef,
            amount: res.amount,
            channelLabel: "M-Pesa",
          });
          setStkPolling(false);
          setStkInfo(null);
          setStkError(null);
          return;
        }

        if (res.paymentStatus === "FAILED") {
          setStkPolling(false);
          setStkInfo(null);
          setStkError(res.message || "M-Pesa payment was cancelled or failed.");
          return;
        }

        if (attempts >= 30) {
          setStkPolling(false);
          setStkInfo(
            "Still awaiting confirmation. Click 'Check Payment Status' if you entered your PIN."
          );
        }
      } catch {
        // Keep polling transiently unless timed out
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stkPolling, orderId, orderNumber, verifiedReceipt]);

  async function handleSendStkPush() {
    if (!orderId) return;
    setStkError(null);
    setStkInfo(null);
    setStkSending(true);

    try {
      const res = await initiateMpesaStk({
        orderId,
        orderNumber,
        phone,
      });
      setStkInfo(res.customerMessage);
      setStkPolling(true);
    } catch (error) {
      setStkError(
        error instanceof Error
          ? error.message
          : "Could not send M-Pesa prompt."
      );
    } finally {
      setStkSending(false);
    }
  }

  async function handleManualStatusCheck() {
    if (!orderId) return;
    setStkError(null);
    try {
      const res = await pollMpesaPaymentStatus({ orderId, orderNumber });
      if (res.paymentStatus === "VERIFIED") {
        setVerifiedReceipt({
          transactionRef: res.transactionRef,
          amount: res.amount,
          channelLabel: "M-Pesa",
        });
        setStkPolling(false);
        setStkInfo(null);
      } else if (res.paymentStatus === "FAILED") {
        setStkPolling(false);
        setStkError(res.message);
      } else {
        setStkInfo(res.message);
      }
    } catch (error) {
      setStkError(
        error instanceof Error
          ? error.message
          : "Unable to check payment status."
      );
    }
  }

  async function handlePaystackPay() {
    if (!orderId) return;
    setPaystackError(null);
    setPaystackLoading(true);

    try {
      const res = await initializePaystackCheckout({
        orderId,
        orderNumber,
        email: customerEmail || undefined,
      });
      window.location.href = res.authorizationUrl;
    } catch (error) {
      setPaystackError(
        error instanceof Error
          ? error.message
          : "Could not start Paystack checkout."
      );
      setPaystackLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-green-600">
            {verifiedReceipt ? "Order paid & verified" : "Order submitted"}
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            {verifiedReceipt ? "Payment received" : "Thank you for your order"}
          </h2>

          <p className="text-sm text-muted-foreground">
            {verifiedReceipt
              ? "Your payment has been verified automatically and your order is now queued for processing."
              : "Complete payment below or confirm delivery details on WhatsApp."}
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

        {verifiedReceipt ? (
          <div className="space-y-2 rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Verified {verifiedReceipt.channelLabel ?? "Online"} Payment
              </span>
            </div>
            <p className="text-muted-foreground">
              Amount paid:{" "}
              <strong className="text-foreground">
                {formatKes(verifiedReceipt.amount)}
              </strong>
            </p>
            {verifiedReceipt.transactionRef ? (
              <p className="text-muted-foreground">
                Receipt reference:{" "}
                <strong className="text-foreground">
                  {verifiedReceipt.transactionRef}
                </strong>
              </p>
            ) : null}
          </div>
        ) : orderId ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>Pay with M-Pesa STK Push</span>
                </div>
                {gatewayAvailability?.darajaEnabled ? (
                  <span className="text-xs font-medium text-green-600">
                    {gatewayAvailability.darajaEnv === "sandbox"
                      ? "Sandbox ready"
                      : "Live"}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  disabled={!darajaEnabled || stkSending || stkPolling}
                />
                <Button
                  type="button"
                  onClick={handleSendStkPush}
                  disabled={!darajaEnabled || stkSending || stkPolling || !phone.trim()}
                >
                  {stkSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : stkPolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Waiting for PIN...
                    </>
                  ) : (
                    `Pay ${formatKes(amount)}`
                  )}
                </Button>
              </div>

              {!darajaEnabled ? (
                <p className="text-xs text-muted-foreground">
                  Instant M-Pesa prompt activates once Safaricom Daraja API
                  credentials are configured.
                </p>
              ) : null}

              {stkInfo ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/60 p-2.5 text-xs">
                  <span>{stkInfo}</span>
                  <button
                    type="button"
                    onClick={handleManualStatusCheck}
                    className="font-medium underline"
                  >
                    Check status
                  </button>
                </div>
              ) : null}

              {stkError ? (
                <p className="text-xs text-destructive">{stkError}</p>
              ) : null}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>Pay with Paystack (M-Pesa or Card)</span>
                </div>
                {paystackEnabled ? (
                  <span className="text-xs font-medium text-green-600">
                    Ready
                  </span>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handlePaystackPay}
                disabled={!paystackEnabled || paystackLoading}
              >
                {paystackLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Paystack checkout...
                  </>
                ) : (
                  `Pay ${formatKes(amount)} via Paystack`
                )}
              </Button>

              {!paystackEnabled ? (
                <p className="text-xs text-muted-foreground">
                  Paystack M-Pesa & card checkout activates once{" "}
                  <code>PAYSTACK_SECRET_KEY</code> is configured.
                </p>
              ) : null}

              {paystackError ? (
                <p className="text-xs text-destructive">{paystackError}</p>
              ) : null}
            </div>

            {isCashOnFulfillment ? (
              <p className="text-center text-xs text-muted-foreground">
                You selected Cash on{" "}
                {preferredPaymentMethod === "CASH_ON_PICKUP"
                  ? "Pickup"
                  : "Delivery"}
                . You can also pay upfront above or confirm via WhatsApp.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2.5 pt-2">
          <Button asChild className="w-full" variant={verifiedReceipt ? "default" : "secondary"}>
            <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
              <MessageCircle className="mr-2 h-4 w-4" />
              Continue on WhatsApp
            </a>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href={`/track?order=${encodeURIComponent(orderNumber)}`}>
              Track order status anytime
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
