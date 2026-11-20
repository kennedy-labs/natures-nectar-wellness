"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Smartphone,
  Truck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { readApiData } from "@/lib/api-client";
import { formatKes } from "@/lib/format";

type TrackedOrder = {
  id: string;
  orderNumber: string;
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
  customerPhone: string;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    quantity: number;
    lineTotal: number;
  }>;
  payment: {
    status: string;
    method: string;
    amount: number | null;
    transactionRef: string | null;
    verifiedAt: string | null;
  } | null;
  statusHistory: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
};

type OrderTrackerProps = {
  gatewayAvailability: GatewayAvailability;
  initialOrderNumber?: string;
};

const PROGRESS_STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "PAID", label: "Payment Confirmed" },
  { key: "PROCESSING", label: "Preparing" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

function getStepIndex(status: string, isPaid: boolean): number {
  if (status === "DELIVERED") return 4;
  if (status === "OUT_FOR_DELIVERY") return 3;
  if (status === "PROCESSING") return 2;
  if (status === "PAID" || isPaid) return 1;
  return 0;
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrderTracker({
  gatewayAvailability,
  initialOrderNumber = "",
}: OrderTrackerProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const [stkPhone, setStkPhone] = useState("");
  const [stkSending, setStkSending] = useState(false);
  const [stkPolling, setStkPolling] = useState(false);
  const [stkInfo, setStkInfo] = useState<string | null>(null);
  const [stkError, setStkError] = useState<string | null>(null);

  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paystackError, setPaystackError] = useState<string | null>(null);

  async function lookupOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStkInfo(null);
    setStkError(null);
    setPaystackError(null);
    setStkPolling(false);
    setLoading(true);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          phone: phone.trim(),
        }),
      });

      const found = await readApiData<TrackedOrder>(response);
      setOrder(found);
      setStkPhone(found.customerPhone);
    } catch (err) {
      setOrder(null);
      setError(
        err instanceof Error ? err.message : "Could not find your order."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrderQuietly(currentOrderNumber: string, currentPhone: string) {
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: currentOrderNumber,
          phone: currentPhone,
        }),
      });
      const updated = await readApiData<TrackedOrder>(response);
      setOrder(updated);
    } catch {
      // Non-fatal refresh
    }
  }

  useEffect(() => {
    if (!stkPolling || !order) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await pollMpesaPaymentStatus({
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
        if (cancelled) return;

        if (res.paymentStatus === "VERIFIED") {
          setStkPolling(false);
          setStkInfo("Payment verified!");
          setStkError(null);
          await refreshOrderQuietly(order.orderNumber, order.customerPhone);
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
            "Still waiting for M-Pesa confirmation. Refresh status if you entered your PIN."
          );
        }
      } catch {
        // Keep polling transiently
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stkPolling, order]);

  async function handleStkPush() {
    if (!order) return;
    setStkError(null);
    setStkInfo(null);
    setStkSending(true);

    try {
      const res = await initiateMpesaStk({
        orderId: order.id,
        orderNumber: order.orderNumber,
        phone: stkPhone,
      });
      setStkInfo(res.customerMessage);
      setStkPolling(true);
    } catch (err) {
      setStkError(
        err instanceof Error ? err.message : "Could not send M-Pesa prompt."
      );
    } finally {
      setStkSending(false);
    }
  }

  async function handlePaystack() {
    if (!order) return;
    setPaystackError(null);
    setPaystackLoading(true);

    try {
      const res = await initializePaystackCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
      window.location.href = res.authorizationUrl;
    } catch (err) {
      setPaystackError(
        err instanceof Error
          ? err.message
          : "Could not start Paystack checkout."
      );
      setPaystackLoading(false);
    }
  }

  const isPaid = order?.payment?.status === "VERIFIED";
  const isCancelled = order?.status === "CANCELLED";
  const canPayOnline = Boolean(order && !isPaid && !isCancelled);
  const currentStep = order ? getStepIndex(order.status, Boolean(isPaid)) : 0;

  const whatsappUrl = order
    ? (getWhatsAppUrl(
        `Hello Nature's Nectar Wellness, I am checking on order ${order.orderNumber}.`
      ) ??
      `https://wa.me/254757122299?text=${encodeURIComponent(
        `Hello Nature's Nectar Wellness, I am checking on order ${order.orderNumber}.`
      )}`)
    : null;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find your order</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={lookupOrder}
            className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="track-order-number"
                className="text-sm font-medium"
              >
                Order number
              </label>
              <input
                id="track-order-number"
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. NNW-2026..."
                className="w-full rounded-md border px-3 py-2 text-sm uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="track-phone" className="text-sm font-medium">
                Phone number used at checkout
              </label>
              <input
                id="track-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712 345 678"
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track order
                  </>
                )}
              </Button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {order ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Order number</p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {order.orderNumber}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <Badge
                  variant={
                    isCancelled
                      ? "destructive"
                      : isPaid || order.status === "DELIVERED"
                        ? "default"
                        : "secondary"
                  }
                >
                  {formatStatusLabel(order.status)}
                </Badge>
              </div>

              {isCancelled ? (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Order cancelled</p>
                    <p className="mt-0.5 text-xs opacity-90">
                      This order was cancelled and reserved items were released
                      back to stock. You can place a new order anytime.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-5">
                  {PROGRESS_STEPS.map((step, index) => {
                    const completed = index <= currentStep;
                    return (
                      <div
                        key={step.key}
                        className={`rounded-lg border p-3 text-xs ${
                          completed
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium">
                          {completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          <span>{step.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4 text-primary" />
                  Items & Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ul className="divide-y">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-medium hover:underline"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatKes(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 border-t pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatKes(order.subtotalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery fee</span>
                    <span>
                      {order.deliveryFee !== null
                        ? formatKes(order.deliveryFee)
                        : "Pending confirmation"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatKes(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4 text-primary" />
                  Delivery & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Delivery method
                  </p>
                  <p className="font-medium">
                    {formatStatusLabel(order.deliveryMethod)}
                  </p>
                  {order.deliveryLocation ? (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {order.deliveryLocation}
                    </p>
                  ) : null}
                  {order.deliveryQuoteNotes ? (
                    <p className="text-xs text-muted-foreground">
                      Note: {order.deliveryQuoteNotes}
                    </p>
                  ) : null}
                </div>

                {isPaid && order.payment ? (
                  <div className="space-y-1 rounded-lg border border-green-500/40 bg-green-500/10 p-3">
                    <p className="flex items-center gap-1.5 font-medium text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Payment Verified
                    </p>
                    {order.payment.transactionRef ? (
                      <p className="text-xs text-muted-foreground">
                        Receipt:{" "}
                        <strong className="text-foreground">
                          {order.payment.transactionRef}
                        </strong>
                      </p>
                    ) : null}
                    {order.payment.amount !== null ? (
                      <p className="text-xs text-muted-foreground">
                        Amount:{" "}
                        <strong className="text-foreground">
                          {formatKes(order.payment.amount)}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {canPayOnline ? (
                  <div className="space-y-3 border-t pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Complete payment now
                    </p>

                    <div className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Smartphone className="h-3.5 w-3.5 text-primary" />
                        <span>M-Pesa STK Push</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={stkPhone}
                          onChange={(e) => setStkPhone(e.target.value)}
                          placeholder="0712 345 678"
                          className="flex-1 rounded-md border px-2.5 py-1.5 text-xs"
                          disabled={
                            !gatewayAvailability.darajaEnabled ||
                            stkSending ||
                            stkPolling
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleStkPush}
                          disabled={
                            !gatewayAvailability.darajaEnabled ||
                            stkSending ||
                            stkPolling ||
                            !stkPhone.trim()
                          }
                        >
                          {stkSending || stkPolling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            `Pay ${formatKes(order.totalAmount)}`
                          )}
                        </Button>
                      </div>
                      {!gatewayAvailability.darajaEnabled ? (
                        <p className="text-xs text-muted-foreground">
                          Activates once Safaricom Daraja credentials are set.
                        </p>
                      ) : null}
                      {stkInfo ? (
                        <p className="text-xs text-muted-foreground">{stkInfo}</p>
                      ) : null}
                      {stkError ? (
                        <p className="text-xs text-destructive">{stkError}</p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handlePaystack}
                      disabled={
                        !gatewayAvailability.paystackEnabled || paystackLoading
                      }
                    >
                      <CreditCard className="mr-2 h-3.5 w-3.5" />
                      {paystackLoading
                        ? "Opening Paystack..."
                        : `Pay ${formatKes(order.totalAmount)} via Paystack`}
                    </Button>

                    {paystackError ? (
                      <p className="text-xs text-destructive">
                        {paystackError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {whatsappUrl ? (
                  <Button asChild variant="secondary" className="w-full" size="sm">
                    <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask about this order on WhatsApp
                    </a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {order.statusHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order activity timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {order.statusHistory.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="font-medium">
                        {formatStatusLabel(entry.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
