"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initiateMpesaStk,
  pollMpesaPaymentStatus,
  releaseUnpaidCheckoutOrder,
} from "@/features/checkout/api/checkout-api";
import { formatKes } from "@/lib/format";

type MpesaPaymentGateProps = {
  orderId: string;
  orderNumber: string;
  amount: number;
  initialPhone: string;
  darajaEnv?: "sandbox" | "production";
  onVerified: (receipt: {
    transactionRef: string | null;
    amount: number;
  }) => void;
  onCancelBack: () => void;
};

export function MpesaPaymentGate({
  orderId,
  orderNumber,
  amount,
  initialPhone,
  darajaEnv = "production",
  onVerified,
  onCancelBack,
}: MpesaPaymentGateProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [stkSending, setStkSending] = useState(true);
  const [stkPolling, setStkPolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [stkError, setStkError] = useState<string | null>(null);
  const [stkInfo, setStkInfo] = useState<string | null>(null);

  const hasAutoTriggeredRef = useRef(false);
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    if (hasAutoTriggeredRef.current) return;
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
  }, [orderId, orderNumber, initialPhone]);

  useEffect(() => {
    if (!stkPolling) return;

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await pollMpesaPaymentStatus({ orderId, orderNumber });
        if (cancelled) return;

        if (res.paymentStatus === "VERIFIED") {
          setStkPolling(false);
          onVerifiedRef.current({
            transactionRef: res.transactionRef,
            amount: res.amount,
          });
          return;
        }

        if (res.paymentStatus === "FAILED") {
          setStkPolling(false);
          setStkInfo(null);
          setStkError(
            res.message || "M-Pesa payment was cancelled or failed."
          );
          return;
        }

        if (attempts >= 30) {
          setStkPolling(false);
          setStkInfo(
            "Timed out waiting automatically. Tap 'Check Payment Status' if you already entered your M-Pesa PIN."
          );
        }
      } catch {
        // Transient polling failure keeps waiting cleanly
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stkPolling, orderId, orderNumber]);

  async function handleRetryStk() {
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

  async function handleCheckStatus() {
    setStkError(null);
    try {
      const res = await pollMpesaPaymentStatus({ orderId, orderNumber });
      if (res.paymentStatus === "VERIFIED") {
        setStkPolling(false);
        onVerified({
          transactionRef: res.transactionRef,
          amount: res.amount,
        });
        return;
      }

      if (res.paymentStatus === "FAILED") {
        setStkPolling(false);
        setStkInfo(null);
        setStkError(res.message || "M-Pesa payment was not completed.");
        return;
      }

      setStkInfo(res.message);
    } catch (error) {
      setStkError(
        error instanceof Error
          ? error.message
          : "Unable to check payment status."
      );
    }
  }

  async function handleBackToCheckout() {
    setCancelling(true);
    setStkError(null);

    try {
      // Final status check in case customer actually just completed PIN entry
      const status = await pollMpesaPaymentStatus({ orderId, orderNumber });
      if (status.paymentStatus === "VERIFIED") {
        onVerified({
          transactionRef: status.transactionRef,
          amount: status.amount,
        });
        return;
      }

      await releaseUnpaidCheckoutOrder({ orderId, orderNumber });
    } catch {
      // Allow returning cleanly even if release fails transiently
    } finally {
      setCancelling(false);
      onCancelBack();
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-6 sm:p-8">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Payment required to complete order</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {stkSending
              ? "Opening M-Pesa..."
              : stkPolling
                ? "Enter M-Pesa PIN on your phone"
                : "Complete M-Pesa payment"}
          </h2>

          <p className="text-sm text-muted-foreground">
            Your order is <strong>not confirmed yet</strong> and your cart stays
            saved until Safaricom confirms your M-Pesa payment.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/40 p-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Checkout reference</p>
            <p className="mt-1 font-mono text-sm font-semibold">{orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="mt-1 text-base font-semibold">{formatKes(amount)}</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Safaricom M-Pesa Prompt</span>
            </div>
            <span className="text-xs font-medium text-emerald-700">
              {darajaEnv === "sandbox" ? "Sandbox" : "Live"}
            </span>
          </div>

          {stkSending ? (
            <div className="flex items-center gap-3 rounded-lg bg-background p-3.5 text-sm">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>
                Sending M-Pesa PIN menu to <strong>{phone}</strong>...
              </span>
            </div>
          ) : null}

          {stkPolling ? (
            <div className="space-y-3 rounded-lg bg-background p-4 text-sm">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    M-Pesa menu sent to {phone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stkInfo ||
                      `Approve ${formatKes(amount)} by entering your M-Pesa PIN. Your order submits automatically as soon as Safaricom confirms.`}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCheckStatus}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
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
                    onClick={handleCheckStatus}
                    className="font-medium text-primary underline"
                  >
                    Check status
                  </button>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="bg-background"
                />
                <Button
                  type="button"
                  onClick={handleRetryStk}
                  disabled={!phone.trim() || cancelling}
                  className="shrink-0"
                >
                  Retry M-Pesa ({formatKes(amount)})
                </Button>
              </div>
            </div>
          ) : null}

          {stkError ? (
            <p className="text-xs font-medium text-destructive">{stkError}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={cancelling || stkSending}
          onClick={handleBackToCheckout}
        >
          {cancelling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Returning to checkout...
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel & return to checkout (switch to Cash on Pickup)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
