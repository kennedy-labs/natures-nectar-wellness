"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  initiateMpesaStk,
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
  mpesaPhone?: string;
  autoStartMpesa?: boolean;
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
  mpesaPhone,
  autoStartMpesa = false,
  preferredPaymentMethod,
  gatewayAvailability,
  initialVerified = null,
}: CheckoutSuccessProps) {
  const initialPhone = (mpesaPhone || customerPhone || "").trim();
  const darajaEnabled = gatewayAvailability?.darajaEnabled ?? false;

  const [phone, setPhone] = useState(initialPhone);
  const [stkSending, setStkSending] = useState(
    Boolean(autoStartMpesa && darajaEnabled && orderId && !initialVerified)
  );
  const [stkPolling, setStkPolling] = useState(false);
  const [stkError, setStkError] = useState<string | null>(null);
  const [stkInfo, setStkInfo] = useState<string | null>(null);

  const [verifiedReceipt, setVerifiedReceipt] = useState<{
    transactionRef: string | null;
    amount: number;
    channelLabel?: string;
  } | null>(initialVerified);

  const hasAutoTriggeredRef = useRef(false);

  const whatsappUrl =
    getWhatsAppUrl(whatsappMessage) ??
    `https://wa.me/254757122299?text=${encodeURIComponent(whatsappMessage)}`;

  const isMpesaOrder = preferredPaymentMethod === "MPESA_BUY_GOODS";
  const isCashOnPickup = preferredPaymentMethod === "CASH_ON_PICKUP";

  useEffect(() => {
    if (
      !autoStartMpesa ||
      !darajaEnabled ||
      !orderId ||
      verifiedReceipt ||
      !initialPhone ||
      hasAutoTriggeredRef.current
    ) {
      return;
    }

    hasAutoTriggeredRef.current = true;
    let cancelled = false;

    initiateMpesaStk({
      orderId,
      orderNumber,
      phone: initialPhone,
    })
      .then((res) => {
        if (cancelled) return;
        setStkInfo(res.customerMessage);
        setStkPolling(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setStkError(
          error instanceof Error
            ? error.message
            : "Could not send M-Pesa PIN prompt to your phone."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setStkSending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [autoStartMpesa, darajaEnabled, orderId, orderNumber, initialPhone, verifiedReceipt]);

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
            "Still waiting for confirmation. Tap 'Check Payment Status' if you already entered your M-Pesa PIN."
          );
        }
      } catch {
        // Keep polling on transient failures until timeout
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

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-green-600">
            {verifiedReceipt
              ? "Order paid & verified"
              : stkPolling || stkSending
                ? "Complete M-Pesa payment"
                : "Order submitted"}
          </p>

          <h2 className="text-3xl font-semibold tracking-tight">
            {verifiedReceipt
              ? "Payment received"
              : stkSending
                ? "Opening M-Pesa..."
                : stkPolling
                  ? "Check your phone"
                  : "Thank you for your order"}
          </h2>

          <p className="text-sm text-muted-foreground">
            {verifiedReceipt
              ? "Your payment has been verified automatically and your order is queued for processing."
              : stkPolling
                ? "Enter your M-Pesa PIN on the Safaricom popup on your phone to complete payment."
                : isCashOnPickup
                  ? "Your order is saved. Pay in cash when collecting your order."
                  : "Complete M-Pesa payment below or confirm delivery details on WhatsApp."}
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
                Verified {verifiedReceipt.channelLabel ?? "M-Pesa"} Payment
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
                M-Pesa receipt:{" "}
                <strong className="text-foreground">
                  {verifiedReceipt.transactionRef}
                </strong>
              </p>
            ) : null}
          </div>
        ) : orderId && isMpesaOrder ? (
          darajaEnabled ? (
            <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>M-Pesa Payment</span>
                </div>
                <span className="text-xs font-medium text-green-600">
                  {gatewayAvailability?.darajaEnv === "sandbox"
                    ? "Sandbox"
                    : "Safaricom M-Pesa"}
                </span>
              </div>

              {stkSending ? (
                <div className="flex items-center gap-3 rounded-lg bg-background p-3.5 text-sm">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  <span>
                    Sending M-Pesa PIN prompt to <strong>{phone}</strong>...
                  </span>
                </div>
              ) : null}

              {stkPolling ? (
                <div className="space-y-3 rounded-lg bg-background p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        M-Pesa prompt sent to {phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stkInfo ||
                          `Enter your M-Pesa PIN to authorize ${formatKes(amount)}. This page updates automatically once Safaricom confirms.`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleManualStatusCheck}
                  >
                    Check Payment Status
                  </Button>
                </div>
              ) : null}

              {!stkSending && !stkPolling ? (
                <div className="space-y-3">
                  {stkInfo ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background p-2.5 text-xs">
                      <span>{stkInfo}</span>
                      <button
                        type="button"
                        onClick={handleManualStatusCheck}
                        className="font-medium text-primary underline"
                      >
                        Check status
                      </button>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleSendStkPush}
                      disabled={!phone.trim()}
                    >
                      {stkError || autoStartMpesa
                        ? `Resend M-Pesa Prompt (${formatKes(amount)})`
                        : `Pay ${formatKes(amount)} via M-Pesa`}
                    </Button>
                  </div>
                </div>
              ) : null}

              {stkError ? (
                <p className="text-xs font-medium text-destructive">
                  {stkError}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>M-Pesa Selected</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your order is reserved for M-Pesa payment of{" "}
                <strong>{formatKes(amount)}</strong>. Tap{" "}
                <strong>Continue on WhatsApp</strong> below to receive our M-Pesa
                payment prompt or Till details and confirm your order.
              </p>
            </div>
          )
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
          <Button
            asChild
            className="w-full"
            variant={verifiedReceipt || !darajaEnabled ? "default" : "secondary"}
          >
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
