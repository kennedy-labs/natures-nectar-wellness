"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { AdminOrdersListSkeleton } from "@/components/skeletons/AdminSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminCancelOrderDialog } from "@/features/admin/components/AdminCancelOrderDialog";
import { AdminDeleteOrderDialog } from "@/features/admin/components/AdminDeleteOrderDialog";
import { AdminOrderDetailSheet } from "@/features/admin/components/AdminOrderDetailSheet";
import { OrderActionsMenu } from "@/features/admin/components/OrderActionsMenu";
import {
  type AdminOrder,
  type AdminOrderCategory,
  type AdminOrderPayment,
  formatAdminOrderDate,
  getAdminDeliveryLabel,
  getAdminOrderCategory,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
  getAdminPaymentMethodLabel,
  getToneClasses,
} from "@/features/admin/utils/order-display.utils";
import {
  normalizeOrderStage,
  type OrderNextAction,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type { AdminOrder };

type AdminOrdersPanelProps = {
  initialOrders?: AdminOrder[];
  onOrdersChange?: (orders: AdminOrder[]) => void;
  selectedOrderId?: string | null;
  onSelectedOrderIdChange?: (orderId: string | null) => void;
};

type OrderFilter = "all" | AdminOrderCategory;

function StatusGlyph({ stage }: { stage: UnifiedOrderStage }) {
  if (stage === "CANCELLED") {
    return <XCircle className="h-3.5 w-3.5 shrink-0" />;
  }
  if (stage === "DELIVERED") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
  }
  if (stage === "OUT_FOR_DELIVERY") {
    return <Truck className="h-3.5 w-3.5 shrink-0" />;
  }
  if (stage === "PROCESSING") {
    return <Package className="h-3.5 w-3.5 shrink-0" />;
  }
  if (stage === "AWAITING_PAYMENT") {
    return <CreditCard className="h-3.5 w-3.5 shrink-0" />;
  }
  if (stage === "REVIEWING_DELIVERY") {
    return <MapPin className="h-3.5 w-3.5 shrink-0" />;
  }
  return <Clock className="h-3.5 w-3.5 shrink-0" />;
}

function summarizeItems(order: AdminOrder): string {
  const items = order.items ?? [];
  if (items.length === 0) return "No items";
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const firstName = items[0]?.productName ?? "";
  if (items.length === 1) {
    return `${totalUnits}× ${firstName}`;
  }
  return `${totalUnits} items · ${firstName} +${items.length - 1}`;
}

export function AdminOrdersPanel({
  initialOrders,
  onOrdersChange,
  selectedOrderId: controlledOrderId,
  onSelectedOrderIdChange,
}: AdminOrdersPanelProps = {}) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders ?? []);
  const [loading, setLoading] = useState(initialOrders === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [panelNotice, setPanelNotice] = useState<{
    tone: "info" | "error";
    text: string;
  } | null>(null);
  const [expiring, setExpiring] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const [internalSelectedOrderId, setInternalSelectedOrderId] = useState<
    string | null
  >(null);
  const [drawerFocusSection, setDrawerFocusSection] = useState<
    "quote" | "payment" | null
  >(null);
  const [orderToCancel, setOrderToCancel] = useState<AdminOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);

  const activeOrderId =
    controlledOrderId !== undefined
      ? controlledOrderId
      : internalSelectedOrderId;

  function setActiveOrderId(nextId: string | null) {
    if (onSelectedOrderIdChange) {
      onSelectedOrderIdChange(nextId);
    } else {
      setInternalSelectedOrderId(nextId);
    }
  }

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) ?? null,
    [orders, activeOrderId]
  );

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const nextOrders: AdminOrder[] = data?.data ?? data ?? [];
      setOrders(nextOrders);
      onOrdersChange?.(nextOrders);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onOrdersChange]);

  useEffect(() => {
    if (initialOrders !== undefined) return;
    let cancelled = false;

    void fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextOrders: AdminOrder[] = data?.data ?? data ?? [];
        setOrders(nextOrders);
        onOrdersChange?.(nextOrders);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialOrders, onOrdersChange]);

  async function confirmDeliveryQuote(
    orderId: string,
    fee: number,
    notes: string
  ) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee, notes }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        payload?.error?.message ??
          payload?.message ??
          "Failed to confirm delivery quote."
      );
    }

    setPanelNotice({
      tone: "info",
      text: `Delivery quote saved (${formatKes(fee)}).`,
    });
    await load();
  }

  async function updateStatus(
    orderId: string,
    status: string,
    noticeText?: string
  ) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(
        payload?.error?.message ??
          payload?.message ??
          "Failed to update order status."
      ) as Error & { code?: string };
      err.code = payload?.code ?? payload?.error?.code;
      throw err;
    }

    setPanelNotice({
      tone: "info",
      text:
        noticeText ??
        (status === "DELIVERED"
          ? "Order marked as delivered."
          : "Order progress updated."),
    });
    await load();
  }

  async function handleNextAction(order: AdminOrder, action: OrderNextAction) {
    if (action.kind === "open_quote" || action.kind === "open_payment") {
      setDrawerFocusSection(action.focusSection);
      setActiveOrderId(order.id);
      return;
    }

    if (busyOrderId) return;
    setBusyOrderId(order.id);
    setPanelNotice(null);

    const noticeText =
      action.targetStatus === "DELIVERED"
        ? action.autoVerifiesCash
          ? `Order ${order.orderNumber} marked Delivered and cash payment verified.`
          : `Order ${order.orderNumber} marked Delivered.`
        : `Order ${order.orderNumber} moved to ${action.label}.`;

    try {
      await updateStatus(order.id, action.targetStatus, noticeText);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not advance order.";
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code ?? "")
          : "";

      if (code === "PAYMENT_REQUIRED") {
        setPanelNotice({
          tone: "error",
          text: `Verify payment for ${order.orderNumber} before continuing.`,
        });
        setDrawerFocusSection("payment");
        setActiveOrderId(order.id);
      } else if (code === "DELIVERY_QUOTE_REQUIRED") {
        setPanelNotice({
          tone: "error",
          text: `Set the delivery quote for ${order.orderNumber} before continuing.`,
        });
        setDrawerFocusSection("quote");
        setActiveOrderId(order.id);
      } else {
        setPanelNotice({
          tone: "error",
          text: message,
        });
      }
    } finally {
      setBusyOrderId(null);
    }
  }

  async function verifyPayment(
    payment: AdminOrderPayment,
    order: AdminOrder,
    transactionRef: string,
    amount: number
  ) {
    const res = await fetch(`/api/payments/${payment.id}/verify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionRef,
        amount,
      }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        payload?.error?.message ??
          payload?.message ??
          "Payment verification failed."
      );
    }

    setPanelNotice({
      tone: "info",
      text: `Payment confirmed for ${order.orderNumber}.`,
    });
    await load();
  }

  async function cancelOrder(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: "POST",
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        payload?.error?.message ?? payload?.message ?? "Failed to cancel order."
      );
    }

    setPanelNotice({
      tone: "info",
      text: "Order cancelled and item stock restored.",
    });
    await load();
  }

  async function deleteOrder(order: AdminOrder) {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "DELETE",
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        payload?.error?.message ??
          payload?.message ??
          "Failed to delete order."
      );
    }

    if (activeOrderId === order.id) {
      setActiveOrderId(null);
    }

    const restored = Boolean(payload?.data?.restoredStock);
    setPanelNotice({
      tone: "info",
      text: restored
        ? `Order ${order.orderNumber} deleted and reserved stock restored.`
        : `Order ${order.orderNumber} permanently deleted.`,
    });
    await load();
  }

  async function expireOldUnpaidOrders() {
    setExpiring(true);
    setPanelNotice(null);

    try {
      const res = await fetch("/api/orders/expire", { method: "POST" });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setPanelNotice({
          tone: "error",
          text:
            payload?.error?.message ??
            "Could not expire unpaid orders right now.",
        });
        return;
      }

      const count = payload?.data?.cancelledCount ?? 0;
      setPanelNotice({
        tone: "info",
        text:
          count > 0
            ? `Expired ${count} unpaid order(s) older than 24h and restored their stock.`
            : "No unpaid orders older than 24 hours were found.",
      });
      await load();
    } finally {
      setExpiring(false);
    }
  }

  const summary = useMemo(() => {
    const counts: Record<AdminOrderCategory, number> = {
      REVIEWING_DELIVERY: 0,
      AWAITING_PAYMENT: 0,
      PROCESSING: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    let deliveredRevenue = 0;

    for (const order of orders) {
      const category = getAdminOrderCategory(order);
      counts[category] += 1;
      if (category === "DELIVERED") {
        deliveredRevenue += getAdminOrderTotal(order);
      }
    }

    return {
      ...counts,
      deliveredRevenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && getAdminOrderCategory(order) !== filter) {
        return false;
      }

      if (!query) return true;
      const itemMatch =
        order.items?.some((item) =>
          item.productName.toLowerCase().includes(query)
        ) ?? false;

      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query) ||
        (order.customerEmail?.toLowerCase().includes(query) ?? false) ||
        itemMatch
      );
    });
  }, [orders, filter, searchQuery]);

  function toggleCategoryFilter(category: AdminOrderCategory) {
    setFilter((current) => (current === category ? "all" : category));
  }

  if (loading) {
    return <AdminOrdersListSkeleton />;
  }

  const stageCards: Array<{
    key: AdminOrderCategory;
    title: string;
    count: number;
    subtext: string;
    countClass: string;
    activeClass: string;
  }> = [
    {
      key: "REVIEWING_DELIVERY",
      title: "Quote Needed",
      count: summary.REVIEWING_DELIVERY,
      subtext: "Courier fee pending",
      countClass:
        summary.REVIEWING_DELIVERY > 0 ? "text-amber-700" : "text-foreground",
      activeClass: "bg-amber-50/75 ring-1 ring-inset ring-amber-300/70",
    },
    {
      key: "AWAITING_PAYMENT",
      title: "Awaiting Payment",
      count: summary.AWAITING_PAYMENT,
      subtext: "Verify M-Pesa / Bank",
      countClass:
        summary.AWAITING_PAYMENT > 0 ? "text-amber-700" : "text-foreground",
      activeClass: "bg-amber-50/75 ring-1 ring-inset ring-amber-300/70",
    },
    {
      key: "PROCESSING",
      title: "Preparing",
      count: summary.PROCESSING,
      subtext: "Ready to pack",
      countClass: summary.PROCESSING > 0 ? "text-sky-700" : "text-foreground",
      activeClass: "bg-sky-50/75 ring-1 ring-inset ring-sky-300/70",
    },
    {
      key: "OUT_FOR_DELIVERY",
      title: "Ready / Dispatched",
      count: summary.OUT_FOR_DELIVERY,
      subtext: "Pickup & riders",
      countClass:
        summary.OUT_FOR_DELIVERY > 0 ? "text-indigo-700" : "text-foreground",
      activeClass: "bg-indigo-50/75 ring-1 ring-inset ring-indigo-300/70",
    },
    {
      key: "DELIVERED",
      title: "Delivered",
      count: summary.DELIVERED,
      subtext:
        summary.deliveredRevenue > 0
          ? formatKes(summary.deliveredRevenue)
          : "Completed",
      countClass: "text-[#1F4E37]",
      activeClass: "bg-[#1F4E37]/[0.08] ring-1 ring-inset ring-[#1F4E37]/30",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 5-Stage Order Lifecycle Summary Strip */}
      <section
        aria-label="Order queue stages"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5"
      >
        {stageCards.map((card) => {
          const active = filter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => toggleCategoryFilter(card.key)}
              className={cn(
                "flex flex-col justify-between bg-white px-3.5 py-3 text-left transition-colors hover:bg-[#F6F7F5]",
                active && card.activeClass
              )}
            >
              <span className="truncate text-xs font-medium text-muted-foreground">
                {card.title}
              </span>
              <span
                className={cn(
                  "mt-1 font-display text-2xl font-medium tabular-nums",
                  card.countClass
                )}
              >
                {card.count}
              </span>
              <span className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {card.subtext}
              </span>
            </button>
          );
        })}
      </section>

      {/* Unified Compact Toolbar: 1-to-1 State Tabs + Search + Maintenance */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-3 sm:p-3.5">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                {
                  key: "all",
                  label: "All",
                  count: orders.length,
                  activeClass: "bg-slate-900 text-white",
                },
                {
                  key: "REVIEWING_DELIVERY",
                  label: "Quote Needed",
                  count: summary.REVIEWING_DELIVERY,
                  activeClass: "bg-amber-600 text-white",
                },
                {
                  key: "AWAITING_PAYMENT",
                  label: "Awaiting Payment",
                  count: summary.AWAITING_PAYMENT,
                  activeClass: "bg-amber-700 text-white",
                },
                {
                  key: "PROCESSING",
                  label: "Preparing",
                  count: summary.PROCESSING,
                  activeClass: "bg-sky-700 text-white",
                },
                {
                  key: "OUT_FOR_DELIVERY",
                  label: "Ready / Dispatched",
                  count: summary.OUT_FOR_DELIVERY,
                  activeClass: "bg-indigo-700 text-white",
                },
                {
                  key: "DELIVERED",
                  label: "Delivered",
                  count: summary.DELIVERED,
                  activeClass: "bg-[#1F4E37] text-white",
                },
                {
                  key: "CANCELLED",
                  label: "Cancelled",
                  count: summary.CANCELLED,
                  activeClass: "bg-rose-700 text-white",
                },
              ] as const
            ).map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "inline-flex min-h-8.5 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium tabular-nums transition-colors whitespace-nowrap",
                    active
                      ? item.activeClass
                      : "bg-[#F6F7F5] text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "text-[11px]",
                      active ? "opacity-85" : "text-muted-foreground/80"
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search #, customer, item..."
                className="h-9 bg-[#F6F7F5]/60 pl-8 pr-8 text-xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                disabled={refreshing}
                onClick={() => void load()}
                size="sm"
                type="button"
                variant="outline"
                className="h-9 flex-1 bg-white px-2.5 text-xs sm:flex-initial"
              >
                <RefreshCw
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    refreshing && "animate-spin"
                  )}
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </Button>

              <Button
                disabled={expiring}
                onClick={expireOldUnpaidOrders}
                size="sm"
                type="button"
                variant="outline"
                className="h-9 flex-1 bg-white px-2.5 text-xs sm:flex-initial"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {expiring ? "Checking..." : "Expire >24h"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {panelNotice ? (
        <div
          role={panelNotice.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-medium",
            panelNotice.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-[#1F4E37]/25 bg-[#1F4E37]/[0.07] text-[#1F4E37]"
          )}
        >
          <span>{panelNotice.text}</span>
          <button
            type="button"
            onClick={() => setPanelNotice(null)}
            aria-label="Dismiss message"
            className="inline-flex h-6 w-6 items-center justify-center rounded opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-[#F6F7F5] text-muted-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-lg font-medium text-foreground">
            {orders.length === 0
              ? "No customer orders yet"
              : "No orders match this view"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {orders.length === 0
              ? "When customers complete checkout on the storefront, their orders will appear here for review and dispatch."
              : "Try clearing your search or switching to another status category."}
          </p>
          {filter !== "all" || searchQuery ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter("all");
                setSearchQuery("");
              }}
              className="mt-4 h-9 bg-white text-xs"
            >
              Show all orders
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white">
          {/* Desktop Compact List Table (md+) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#F6F7F5] text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="py-2.5 pl-4 pr-3">Order</th>
                  <th className="px-3 py-2.5">Customer &amp; Items</th>
                  <th className="px-3 py-2.5">Channel</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {filteredOrders.map((order) => {
                  const stage = normalizeOrderStage(order);
                  const total = getAdminOrderTotal(order);
                  const statusMeta = getAdminOrderStatusMeta(order);
                  const tone = getToneClasses(statusMeta.tone);
                  const isQuotePending = stage === "REVIEWING_DELIVERY";

                  return (
                    <tr
                      key={order.id}
                      onClick={() => {
                        setDrawerFocusSection(null);
                        setActiveOrderId(order.id);
                      }}
                      className="group cursor-pointer transition-colors hover:bg-[#F6F7F5]/80"
                    >
                      <td className="whitespace-nowrap py-2.5 pl-4 pr-3 align-middle">
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {formatAdminOrderDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="max-w-[260px] px-3 py-2.5 align-middle">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {order.customerName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {summarizeItems(order)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-xs">
                        <p className="font-medium text-foreground">
                          {getAdminDeliveryLabel(order.deliveryMethod)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {getAdminPaymentMethodLabel(
                            order.preferredPaymentMethod
                          )}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2.5 align-middle">
                        <div className="flex flex-col items-start gap-0.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                              tone.badgeClass
                            )}
                          >
                            <StatusGlyph stage={stage} />
                            <span>{statusMeta.label}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {statusMeta.nextActionHint}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2.5 text-right align-middle tabular-nums">
                        <p className="text-[13px] font-semibold text-foreground">
                          {formatKes(total)}
                        </p>
                        {isQuotePending ? (
                          <p className="text-[11px] font-medium text-amber-700">
                            Quote needed
                          </p>
                        ) : null}
                      </td>

                      <td
                        className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <OrderActionsMenu
                          order={order}
                          busy={busyOrderId === order.id}
                          onViewDetails={(target) => {
                            setDrawerFocusSection(null);
                            setActiveOrderId(target.id);
                          }}
                          onNextAction={(target, action) =>
                            void handleNextAction(target, action)
                          }
                          onCancel={(target) => setOrderToCancel(target)}
                          onDelete={(target) => setOrderToDelete(target)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact List Rows (< md) */}
          <div className="divide-y divide-border md:hidden">
            {filteredOrders.map((order) => {
              const stage = normalizeOrderStage(order);
              const total = getAdminOrderTotal(order);
              const statusMeta = getAdminOrderStatusMeta(order);
              const tone = getToneClasses(statusMeta.tone);

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    setDrawerFocusSection(null);
                    setActiveOrderId(order.id);
                  }}
                  className="cursor-pointer space-y-2 p-3.5 transition-colors hover:bg-[#F6F7F5]/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          · {formatAdminOrderDate(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {summarizeItems(order)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right tabular-nums">
                      <p className="text-sm font-semibold text-foreground">
                        {formatKes(total)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {getAdminPaymentMethodLabel(
                          order.preferredPaymentMethod
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                          tone.badgeClass
                        )}
                      >
                        <StatusGlyph stage={stage} />
                        <span>{statusMeta.label}</span>
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {getAdminDeliveryLabel(order.deliveryMethod)}
                      </span>
                    </div>

                    <div
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OrderActionsMenu
                        order={order}
                        busy={busyOrderId === order.id}
                        onViewDetails={(target) => {
                          setDrawerFocusSection(null);
                          setActiveOrderId(target.id);
                        }}
                        onNextAction={(target, action) =>
                          void handleNextAction(target, action)
                        }
                        onCancel={(target) => setOrderToCancel(target)}
                        onDelete={(target) => setOrderToDelete(target)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-Over Order Details Drawer */}
      <AdminOrderDetailSheet
        order={activeOrder}
        focusSection={drawerFocusSection}
        onClose={() => {
          setDrawerFocusSection(null);
          setActiveOrderId(null);
        }}
        onConfirmDeliveryQuote={confirmDeliveryQuote}
        onUpdateStatus={updateStatus}
        onVerifyPayment={verifyPayment}
        onCancelOrder={cancelOrder}
        onDeleteOrder={deleteOrder}
      />

      {/* Row Cancel Confirmation Modal */}
      <AdminCancelOrderDialog
        order={orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirmCancel={async (target) => {
          await cancelOrder(target.id);
        }}
      />

      {/* Row Delete Confirmation Modal */}
      <AdminDeleteOrderDialog
        order={orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirmDelete={deleteOrder}
      />
    </div>
  );
}