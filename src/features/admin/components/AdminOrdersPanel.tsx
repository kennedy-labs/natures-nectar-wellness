"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { AdminOrdersListSkeleton } from "@/components/skeletons/AdminSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminDeleteOrderDialog } from "@/features/admin/components/AdminDeleteOrderDialog";
import { AdminOrderDetailSheet } from "@/features/admin/components/AdminOrderDetailSheet";
import {
  type AdminOrder,
  type AdminOrderPayment,
  formatAdminOrderDate,
  getAdminDeliveryLabel,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
  getAdminPaymentMethodLabel,
  getToneClasses,
} from "@/features/admin/utils/order-display.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type { AdminOrder };

type AdminOrdersPanelProps = {
  initialOrders?: AdminOrder[];
  onOrdersChange?: (orders: AdminOrder[]) => void;
  selectedOrderId?: string | null;
  onSelectedOrderIdChange?: (orderId: string | null) => void;
};

type OrderFilter =
  | "all"
  | "needs_action"
  | "fulfillment"
  | "delivered"
  | "cancelled";

function StatusGlyph({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return <XCircle className="h-3.5 w-3.5 shrink-0" />;
  }
  if (status === "DELIVERED" || status === "PAID") {
    return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
  }
  if (status === "OUT_FOR_DELIVERY") {
    return <Truck className="h-3.5 w-3.5 shrink-0" />;
  }
  if (status === "PROCESSING") {
    return <Package className="h-3.5 w-3.5 shrink-0" />;
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

  const [internalSelectedOrderId, setInternalSelectedOrderId] = useState<
    string | null
  >(null);
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

  async function updateStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(
        payload?.error?.message ??
          payload?.message ??
          "Failed to update order status."
      );
    }

    setPanelNotice({
      tone: "info",
      text: "Order progress updated.",
    });
    await load();
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
            payload?.error?.message ?? "Could not expire unpaid orders right now.",
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
    const needsAction = orders.filter((o) =>
      ["PENDING", "REVIEWING_DELIVERY", "AWAITING_PAYMENT"].includes(o.status)
    );
    const fulfillment = orders.filter((o) =>
      ["PAID", "PROCESSING", "OUT_FOR_DELIVERY"].includes(o.status)
    );
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");

    const completedRevenue = delivered.reduce(
      (sum, o) => sum + getAdminOrderTotal(o),
      0
    );

    return {
      needsActionCount: needsAction.length,
      fulfillmentCount: fulfillment.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      completedRevenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (
        filter === "needs_action" &&
        !["PENDING", "REVIEWING_DELIVERY", "AWAITING_PAYMENT"].includes(
          order.status
        )
      ) {
        return false;
      }
      if (
        filter === "fulfillment" &&
        !["PAID", "PROCESSING", "OUT_FOR_DELIVERY"].includes(order.status)
      ) {
        return false;
      }
      if (filter === "delivered" && order.status !== "DELIVERED") return false;
      if (filter === "cancelled" && order.status !== "CANCELLED") return false;

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

  if (loading) {
    return <AdminOrdersListSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Interactive 4-Segment Queue Strip */}
      <section
        aria-label="Order queue summary"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4"
      >
        <button
          type="button"
          onClick={() => setFilter("needs_action")}
          className={cn(
            "flex flex-col justify-between bg-[#FCFBF8] p-4 text-left transition-colors hover:bg-[#F7F5F0]",
            filter === "needs_action" && "bg-[#F7F5F0]"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Needs attention
          </span>
          <span
            className={cn(
              "mt-1.5 font-display text-2xl font-medium tabular-nums",
              summary.needsActionCount > 0
                ? "text-amber-800"
                : "text-foreground"
            )}
          >
            {summary.needsActionCount}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            Quote or payment check
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("fulfillment")}
          className={cn(
            "flex flex-col justify-between bg-[#FCFBF8] p-4 text-left transition-colors hover:bg-[#F7F5F0]",
            filter === "fulfillment" && "bg-[#F7F5F0]"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Ready &amp; in transit
          </span>
          <span className="mt-1.5 font-display text-2xl font-medium tabular-nums text-[#1F4E37]">
            {summary.fulfillmentCount}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">
            Paid, packing, or delivering
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("delivered")}
          className={cn(
            "flex flex-col justify-between bg-[#FCFBF8] p-4 text-left transition-colors hover:bg-[#F7F5F0]",
            filter === "delivered" && "bg-[#F7F5F0]"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            Completed
          </span>
          <span className="mt-1.5 font-display text-2xl font-medium tabular-nums text-foreground">
            {summary.deliveredCount}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            {formatKes(summary.completedRevenue)} delivered
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "flex flex-col justify-between bg-[#FCFBF8] p-4 text-left transition-colors hover:bg-[#F7F5F0]",
            filter === "all" && "bg-[#F7F5F0]"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            All orders
          </span>
          <span className="mt-1.5 font-display text-2xl font-medium tabular-nums text-foreground">
            {orders.length}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            {summary.cancelledCount} cancelled
          </span>
        </button>
      </section>

      {/* Search, Status Filter Tabs & Maintenance Tools */}
      <div className="rounded-xl border border-border bg-[#FCFBF8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, order #, or item..."
              className="h-10 bg-white pl-9 pr-9"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={refreshing}
              onClick={() => void load()}
              size="sm"
              type="button"
              variant="outline"
              className="min-h-10 flex-1 bg-white sm:flex-initial"
            >
              <RefreshCw
                className={cn("mr-1.5 h-4 w-4", refreshing && "animate-spin")}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <Button
              disabled={expiring}
              onClick={expireOldUnpaidOrders}
              size="sm"
              type="button"
              variant="outline"
              className="min-h-10 flex-1 bg-white sm:flex-initial"
            >
              <Clock className="mr-1.5 h-4 w-4" />
              {expiring ? "Checking..." : "Expire unpaid (>24h)"}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex gap-1 overflow-x-auto border-t border-border/80 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { key: "all", label: `All (${orders.length})` },
              {
                key: "needs_action",
                label: `Needs action (${summary.needsActionCount})`,
              },
              {
                key: "fulfillment",
                label: `In progress (${summary.fulfillmentCount})`,
              },
              {
                key: "delivered",
                label: `Completed (${summary.deliveredCount})`,
              },
              {
                key: "cancelled",
                label: `Cancelled (${summary.cancelledCount})`,
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
                  "min-h-9 shrink-0 rounded-md px-3 text-xs font-medium tabular-nums transition-colors whitespace-nowrap",
                  active
                    ? "bg-[#1F4E37] text-white"
                    : "text-muted-foreground hover:bg-[#F7F5F0] hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {panelNotice ? (
        <div
          role={panelNotice.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium",
            panelNotice.tone === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-[#FCFBF8] px-6 py-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="mt-3 font-display text-lg font-medium text-foreground">
            {orders.length === 0
              ? "No customer orders yet"
              : "No orders match this view"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {orders.length === 0
              ? "When customers complete checkout on the storefront, their orders will appear here for confirmation and dispatch."
              : "Try clearing your search or switching to another status tab."}
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
              className="mt-4 min-h-9 bg-white"
            >
              Show all orders
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-[#FCFBF8]">
          {/* Desktop Clean Ledger Table (md+) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#F7F5F0]/80 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="py-3 pl-5 pr-3">Order</th>
                  <th className="px-3 py-3">Customer &amp; items</th>
                  <th className="px-3 py-3">Channel</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {filteredOrders.map((order) => {
                  const total = getAdminOrderTotal(order);
                  const statusMeta = getAdminOrderStatusMeta(order);
                  const tone = getToneClasses(statusMeta.tone);
                  const isQuotePending =
                    order.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
                    order.deliveryFee == null &&
                    !["DELIVERED", "CANCELLED"].includes(order.status);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => setActiveOrderId(order.id)}
                      className="group cursor-pointer transition-colors hover:bg-[#F7F5F0]/75"
                    >
                      <td className="py-3.5 pl-5 pr-3 align-middle">
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                          {formatAdminOrderDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="max-w-[260px] px-3 py-3.5 align-middle">
                        <p className="truncate font-medium text-foreground">
                          {order.customerName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {summarizeItems(order)}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 align-middle text-xs">
                        <p className="font-medium text-foreground">
                          {getAdminDeliveryLabel(order.deliveryMethod)}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {getAdminPaymentMethodLabel(
                            order.preferredPaymentMethod
                          )}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 align-middle">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-semibold",
                            tone.text
                          )}
                        >
                          <StatusGlyph status={order.status} />
                          <span>{statusMeta.label}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {statusMeta.nextActionHint}
                        </p>
                      </td>

                      <td className="px-3 py-3.5 text-right align-middle tabular-nums">
                        <p className="font-semibold text-foreground">
                          {formatKes(total)}
                        </p>
                        {isQuotePending ? (
                          <p className="mt-0.5 text-[11px] text-amber-800">
                            Quote needed
                          </p>
                        ) : null}
                      </td>

                      <td
                        className="py-3.5 pl-3 pr-5 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveOrderId(order.id)}
                            className="h-9 gap-1 bg-white px-3 text-xs font-medium hover:border-[#1F4E37]/40 hover:text-[#1F4E37]"
                          >
                            <span>View details</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete order ${order.orderNumber}`}
                            onClick={() => setOrderToDelete(order)}
                            className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
              const total = getAdminOrderTotal(order);
              const statusMeta = getAdminOrderStatusMeta(order);
              const tone = getToneClasses(statusMeta.tone);

              return (
                <div
                  key={order.id}
                  className="space-y-3 p-4 transition-colors hover:bg-[#F7F5F0]/60"
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
                      <p className="mt-1 truncate font-medium text-foreground">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {summarizeItems(order)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right tabular-nums">
                      <p className="font-semibold text-foreground">
                        {formatKes(total)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {getAdminPaymentMethodLabel(
                          order.preferredPaymentMethod
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold",
                          tone.text
                        )}
                      >
                        <StatusGlyph status={order.status} />
                        <span>{statusMeta.label}</span>
                      </span>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {getAdminDeliveryLabel(order.deliveryMethod)} ·{" "}
                        {statusMeta.nextActionHint}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveOrderId(order.id)}
                        className="min-h-10 gap-1 bg-white px-3 text-xs"
                      >
                        <span>View details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete order ${order.orderNumber}`}
                        onClick={() => setOrderToDelete(order)}
                        className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        onClose={() => setActiveOrderId(null)}
        onConfirmDeliveryQuote={confirmDeliveryQuote}
        onUpdateStatus={updateStatus}
        onVerifyPayment={verifyPayment}
        onCancelOrder={cancelOrder}
        onDeleteOrder={deleteOrder}
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