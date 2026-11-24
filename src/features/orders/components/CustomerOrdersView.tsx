"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import { CustomerOrdersSkeleton } from "@/components/skeletons/StorefrontSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import type { PaymentMethod } from "@/features/checkout/types/checkout.types";
import { readApiData } from "@/lib/api-client";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders.store";

type CustomerOrder = {
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

const emptySubscribe = () => () => {};

const TRACKING_STEPS = [
  { key: "PLACED", label: "Order Placed" },
  { key: "PROCESSING", label: "Preparing" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

function getProgressIndex(status: string): number {
  if (status === "DELIVERED") return 3;
  if (status === "OUT_FOR_DELIVERY") return 2;
  if (status === "PROCESSING") return 1;
  return 0;
}

function getFriendlyStatusLabel(status: string, isPaid: boolean): string {
  if (status === "CANCELLED") return "Cancelled";
  if (status === "DELIVERED") return "Delivered";
  if (status === "OUT_FOR_DELIVERY") return "Out for Delivery";
  if (status === "PROCESSING") return "Preparing";
  if (status === "PAID" || isPaid) return "Confirmed";
  return "Order Placed";
}

function formatDeliveryMethod(method: string): string {
  return method
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

export function CustomerOrdersView() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const savedRefs = useOrdersStore((state) => state.orders);

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const refsKey = JSON.stringify(
    savedRefs.map((r) => ({
      orderNumber: r.orderNumber,
      phone: r.phone,
    }))
  );

  const fetchOrdersFromApi = useCallback(async (refsPayload: string) => {
    const res = await fetch("/api/orders/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"refs":${refsPayload}}`,
    });

    return readApiData<CustomerOrder[]>(res);
  }, []);

  useEffect(() => {
    if (!isClient || savedRefs.length === 0) {
      return;
    }

    let cancelled = false;

    fetchOrdersFromApi(refsKey)
      .then((data) => {
        if (cancelled) return;
        setOrders(data);
        setError(null);
        setExpandedOrderId((prev) =>
          prev && data.some((o) => o.id === prev) ? prev : (data[0]?.id ?? null)
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your orders right now."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isClient, savedRefs.length, refsKey, fetchOrdersFromApi]);

  async function handleRefresh() {
    if (!isClient || savedRefs.length === 0) return;
    setRefreshing(true);
    setError(null);

    try {
      const data = await fetchOrdersFromApi(refsKey);
      setOrders(data);
      setExpandedOrderId((prev) =>
        prev && data.some((o) => o.id === prev) ? prev : (data[0]?.id ?? null)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load your orders right now."
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (!isClient) {
    return <CustomerOrdersSkeleton />;
  }

  if (savedRefs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-medium text-foreground">
          No orders yet
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Orders you place on this browser will appear here automatically so you
          can view your items and delivery status anytime.
        </p>
        <Button asChild className="mt-6 min-h-11 w-full sm:w-auto">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return <CustomerOrdersSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 text-center shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-primary">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-medium text-foreground">
          No orders found
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          No confirmed orders were found for this browser yet.
        </p>
        <Button asChild className="mt-6 min-h-11 w-full sm:w-auto">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Tap any order to view items and live tracking status.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={handleRefresh}
          className="min-h-10 shrink-0 gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const isPaid = order.payment?.status === "VERIFIED";
          const isCancelled = order.status === "CANCELLED";
          const progressIndex = getProgressIndex(order.status);
          const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
          const statusLabel = getFriendlyStatusLabel(order.status, isPaid);

          const whatsappUrl =
            getWhatsAppUrl(
              `Hello Nature's Nectar Wellness, I am checking on my order ${order.orderNumber}.`
            ) ??
            `https://wa.me/254757122299?text=${encodeURIComponent(
              `Hello Nature's Nectar Wellness, I am checking on my order ${order.orderNumber}.`
            )}`;

          return (
            <div
              key={order.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(24,42,32,0.04)] transition-colors",
                isExpanded ? "border-primary/40 shadow-sm" : "hover:border-primary/30"
              )}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedOrderId(isExpanded ? null : order.id)
                }
                className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-all font-mono text-sm font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
                    <Badge
                      variant={
                        isCancelled
                          ? "destructive"
                          : order.status === "DELIVERED" || isPaid
                            ? "default"
                            : "secondary"
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)} · {itemCount}{" "}
                    {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums sm:text-base">
                    {formatKes(order.totalAmount)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {isExpanded ? (
                <div className="space-y-5 border-t bg-muted/20 p-4 sm:p-5">
                  {/* Order Tracking Status */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Order Tracking Status
                    </p>

                    {isCancelled ? (
                      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium">Order cancelled</p>
                          <p className="mt-0.5 opacity-90">
                            This order was cancelled. Place a new order anytime.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {TRACKING_STEPS.map((step, index) => {
                          const completed = index <= progressIndex;
                          const isCurrent = index === progressIndex;

                          return (
                            <div
                              key={step.key}
                              className={cn(
                                "rounded-lg border px-3 py-2.5 text-xs",
                                completed
                                  ? "border-primary/40 bg-primary/10 text-foreground"
                                  : "bg-background text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center gap-1.5 font-medium">
                                {completed ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <span>{step.label}</span>
                              </div>
                              {isCurrent ? (
                                <p className="mt-1 text-[11px] font-medium text-primary">
                                  Current status
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Ordered Items & Totals */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-lg border bg-background p-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <span>Ordered Items</span>
                      </div>

                      <ul className="divide-y text-sm">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.productSlug}`}
                                className="font-medium hover:underline"
                              >
                                {item.productName}
                              </Link>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {item.quantity} × {formatKes(item.priceAtPurchase)}
                              </p>
                            </div>
                            <span className="shrink-0 font-medium tabular-nums">
                              {formatKes(item.lineTotal)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-1 border-t pt-2.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span className="tabular-nums">
                            {formatKes(order.subtotalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Delivery</span>
                          <span className="tabular-nums">
                            {order.deliveryFee !== null
                              ? formatKes(order.deliveryFee)
                              : "To be confirmed"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 text-sm font-semibold text-foreground">
                          <span>Total</span>
                          <span className="tabular-nums">
                            {formatKes(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery & Payment Info */}
                    <div className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <Truck className="h-3.5 w-3.5 text-primary" />
                          <span>Delivery & Payment</span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">Delivery method</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatDeliveryMethod(order.deliveryMethod)}
                          </p>
                          {order.deliveryLocation ? (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{order.deliveryLocation}</span>
                            </p>
                          ) : null}
                          {order.deliveryQuoteNotes ? (
                            <p className="text-muted-foreground">
                              Note: {order.deliveryQuoteNotes}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1 text-xs">
                          <p className="text-muted-foreground">Payment</p>
                          <p className="text-sm font-medium text-foreground">
                            {order.preferredPaymentMethod === "CASH_ON_PICKUP"
                              ? isPaid
                                ? "Cash on Pickup (Paid)"
                                : "Cash on Pickup"
                              : isPaid
                                ? "M-Pesa (Paid)"
                                : "M-Pesa"}
                          </p>
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full min-h-11"
                      >
                        <a
                          href={whatsappUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                          Ask about this order on WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
