"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  initiateMpesaStk,
  pollMpesaPaymentStatus,
  releaseUnpaidCheckoutOrder,
} from "@/features/checkout/api/checkout-api";
import { createMpesaPendingMessage } from "@/features/whatsapp/utils/whatsapp.utils";
import { formatKes } from "@/lib/format";

type MpesaPaymentGateProps = {
  orderId: string;
  orderNumber: string;
  customerName?: string;
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
  customerName,
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
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-6 sm:p-8">
      <WhatsAppPageContext
        message={createMpesaPendingMessage({ orderNumber, customerName })}
      />
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Awaiting M-Pesa PIN confirmation</span>
          </div>

          <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {stkSending
              ? "Opening M-Pesa..."
              : stkPolling
                ? "Check your handset for M-Pesa"
                : "Complete M-Pesa payment"}
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Your bag stays reserved until Safaricom confirms your payment.
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-background text-center">
          <div className="min-w-0 p-3.5">
            <p className="text-xs text-muted-foreground">Reference</p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
              {orderNumber}
            </p>
          </div>
          <div className="min-w-0 p-3.5">
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatKes(amount)}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Safaricom M-Pesa Prompt</span>
            </div>
            <span className="text-xs font-medium text-primary">
              {darajaEnv === "sandbox" ? "Sandbox" : "Live"}
            </span>
          </div>

          {stkSending ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3.5 text-sm">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              <span>
                Sending M-Pesa PIN menu to <strong className="tabular-nums">{phone}</strong>...
              </span>
            </div>
          ) : null}

          {stkPolling ? (
            <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    M-Pesa menu sent to <span className="tabular-nums">{phone}</span>
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {stkInfo ||
                      `Approve ${formatKes(amount)} by entering your M-Pesa PIN. Your receipt opens automatically once confirmed.`}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 w-full bg-background"
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
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-2.5 text-xs">
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
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="bg-card tabular-nums"
                />
                <Button
                  type="button"
                  onClick={handleRetryStk}
                  disabled={!phone.trim() || cancelling}
                  className="min-h-10 shrink-0"
                >
                  Retry ({formatKes(amount)})
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
          className="h-auto min-h-11 w-full whitespace-normal bg-background py-2.5 text-center text-xs leading-snug"
          disabled={cancelling || stkSending}
          onClick={handleBackToCheckout}
        >
          {cancelling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              Returning to checkout...
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
              Cancel &amp; return to checkout (switch to Cash on Pickup)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
