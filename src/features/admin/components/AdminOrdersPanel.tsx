"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

import { AdminOrdersListSkeleton } from "@/components/skeletons/AdminSkeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDeliveryFeeSummary,
  getDeliveryMethodLabel,
  parseDeliveryNotesPin,
} from "@/features/orders/utils/order.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Payment = {
  id: string;
  method:
    | "MPESA_BUY_GOODS"
    | "BANK_TRANSFER"
    | "CASH_ON_PICKUP"
    | "CASH_ON_DELIVERY";
  status:
    | "PENDING"
    | "AWAITING_VERIFICATION"
    | "VERIFIED"
    | "FAILED"
    | "REFUNDED";
  amount?: number | null;
  transactionRef?: string | null;
  verifiedAt?: Date | string | null;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryMethod: string;
  deliveryLocation?: string | null;
  deliveryNotes?: string | null;
  deliveryFee?: number | null;
  deliveryQuoteNotes?: string | null;
  subtotalAmount: number;
  totalAmount?: number | null;
  preferredPaymentMethod?: string | null;
  customerNotes?: string | null;
  createdAt: Date | string;
  items?: OrderItem[];
  payments?: Payment[];
};

type AdminOrdersPanelProps = {
  initialOrders?: AdminOrder[];
  onOrdersChange?: (orders: AdminOrder[]) => void;
};

type OrderFilter =
  | "all"
  | "needs_action"
  | "fulfillment"
  | "delivered"
  | "cancelled";

function toWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

function getStatusTextClass(status: string): string {
  if (status === "PAID" || status === "DELIVERED") {
    return "text-primary";
  }
  if (status === "CANCELLED") {
    return "text-destructive";
  }
  if (status === "AWAITING_PAYMENT" || status === "PENDING") {
    return "text-amber-700";
  }
  return "text-foreground";
}

export function AdminOrdersPanel({
  initialOrders,
  onOrdersChange,
}: AdminOrdersPanelProps = {}) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders ?? []);
  const [loading, setLoading] = useState(initialOrders === undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [expiring, setExpiring] = useState(false);
  const [cancelConfirmOrderId, setCancelConfirmOrderId] = useState<
    string | null
  >(null);
  const [errorByOrderId, setErrorByOrderId] = useState<Record<string, string>>(
    {}
  );
  const [quotesByOrderId, setQuotesByOrderId] = useState<
    Record<string, { fee: string; notes: string }>
  >({});
  const [verifyByOrderId, setVerifyByOrderId] = useState<
    Record<string, { transactionRef: string; amount: string }>
  >({});

  async function load() {
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
  }

  function setOrderError(orderId: string, message: string | null) {
    setErrorByOrderId((prev) => {
      if (!message) {
        const next = { ...prev };
        delete next[orderId];
        return next;
      }
      return { ...prev, [orderId]: message };
    });
  }

  async function confirmDelivery(orderId: string) {
    const quote = quotesByOrderId[orderId] ?? { fee: "", notes: "" };
    const fee = Number(quote.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      setOrderError(orderId, "Enter a valid delivery fee (0 or higher).");
      return;
    }

    setBusyOrderId(orderId);
    setOrderError(orderId, null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee, notes: quote.notes }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setOrderError(
          orderId,
          payload?.error?.message ??
            payload?.message ??
            "Failed to confirm delivery quote."
        );
        return;
      }

      await load();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    setBusyOrderId(orderId);
    setOrderError(orderId, null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setOrderError(
          orderId,
          payload?.error?.message ??
            payload?.message ??
            "Failed to update order status."
        );
        return;
      }

      await load();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function verifyPayment(payment: Payment, order: AdminOrder) {
    const expectedTotal =
      order.totalAmount ?? order.subtotalAmount + (order.deliveryFee ?? 0);
    const input = verifyByOrderId[order.id] ?? {
      transactionRef: "",
      amount: String(expectedTotal),
    };

    const amount = Number(input.amount || expectedTotal);
    if (!Number.isFinite(amount) || amount <= 0) {
      setOrderError(order.id, "Enter a valid positive payment amount.");
      return;
    }

    setBusyOrderId(order.id);
    setOrderError(order.id, null);

    try {
      const res = await fetch(`/api/payments/${payment.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionRef: input.transactionRef.trim(),
          amount,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setOrderError(
          order.id,
          payload?.error?.message ??
            payload?.message ??
            "Payment verification failed."
        );
        return;
      }

      await load();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function cancelAndRestoreStock(orderId: string) {
    setBusyOrderId(orderId);
    setOrderError(orderId, null);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setOrderError(
          orderId,
          payload?.error?.message ??
            payload?.message ??
            "Failed to cancel order."
        );
        return;
      }

      setCancelConfirmOrderId(null);
      setPanelMessage("Order cancelled and item stock restored.");
      await load();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function expireOldUnpaidOrders() {
    setExpiring(true);
    setPanelMessage(null);

    try {
      const res = await fetch("/api/orders/expire", { method: "POST" });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setPanelMessage(
          payload?.error?.message ?? "Could not expire unpaid orders."
        );
        return;
      }

      const count = payload?.data?.cancelledCount ?? 0;
      setPanelMessage(
        count > 0
          ? `Expired ${count} unpaid order(s) older than 24h and restored their stock.`
          : "No unpaid orders older than 24 hours found."
      );
      await load();
    } finally {
      setExpiring(false);
    }
  }

  useEffect(() => {
    if (initialOrders === undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load();
    }
  }, [initialOrders]);

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
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query)
      );
    });
  }, [orders, filter, searchQuery]);

  if (loading) {
    return <AdminOrdersListSkeleton />;
  }

  return (
    <div className="space-y-5">
      {/* Unified Filter & Action Toolbar */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, name, phone..."
              className="h-10 bg-white pl-9"
            />
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
                className={`mr-1.5 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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

        <div className="mt-3 flex gap-1 overflow-x-auto border-t border-border pt-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { key: "all", label: `All (${orders.length})` },
              { key: "needs_action", label: "Needs action" },
              { key: "fulfillment", label: "Paid / Delivering" },
              { key: "delivered", label: "Delivered" },
              { key: "cancelled", label: "Cancelled" },
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-[#F6F7F5] hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {panelMessage ? (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          {panelMessage}
        </div>
      ) : null}

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">
          No orders match your current filter.
        </div>
      ) : null}

      {filteredOrders.map((order) => {
        const payment = order.payments?.[0];
        const paymentStatus = payment?.status;
        const isPaid =
          order.payments?.some((p) => p.status === "VERIFIED") ?? false;
        const isCashOrder =
          order.preferredPaymentMethod === "CASH_ON_PICKUP" ||
          order.preferredPaymentMethod === "CASH_ON_DELIVERY";
        const canFulfill = isPaid || isCashOrder;
        const isClosed =
          order.status === "DELIVERED" || order.status === "CANCELLED";
        const total =
          order.totalAmount ??
          order.subtotalAmount + (order.deliveryFee ?? 0);
        const isBusy = busyOrderId === order.id;

        const quote = quotesByOrderId[order.id] ?? { fee: "", notes: "" };
        const verifyInput = verifyByOrderId[order.id] ?? {
          transactionRef: "",
          amount: String(total),
        };

        const waMessage = `Hello ${order.customerName}, regarding your Nature's Nectar order ${order.orderNumber} (Total: ${formatKes(total)}).`;
        const waHref = `https://wa.me/${toWhatsAppPhone(order.customerPhone)}?text=${encodeURIComponent(waMessage)}`;
        const { cleanNotes: cleanDeliveryNotes, mapUrl } =
          parseDeliveryNotesPin(order.deliveryNotes);

        return (
          <div
            key={order.id}
            className="overflow-hidden rounded-xl border border-border bg-white"
          >
            {/* Header Ledger Band */}
            <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {order.orderNumber}
                  </p>
                  <span
                    className={`text-xs font-semibold ${getStatusTextClass(order.status)}`}
                  >
                    · {order.status.replace(/_/g, " ")}
                  </span>
                  {paymentStatus ? (
                    <span
                      className={`text-xs font-medium ${
                        paymentStatus === "VERIFIED"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      · Payment: {paymentStatus.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {new Date(order.createdAt).toLocaleString()}
                  {order.preferredPaymentMethod
                    ? ` · ${order.preferredPaymentMethod.replace(/_/g, " ")}`
                    : ""}
                  {payment?.transactionRef
                    ? ` · Ref: ${payment.transactionRef}`
                    : ""}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="font-display text-xl font-medium tracking-tight tabular-nums text-foreground">
                  {formatKes(total)}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Subtotal {formatKes(order.subtotalAmount)}
                  {` · Delivery: ${getDeliveryFeeSummary(
                    order.deliveryMethod,
                    order.deliveryFee
                  )}`}
                </p>
              </div>
            </div>

            {/* Single-Elevation Hairline Customer & Delivery Ledger */}
            <div className="grid divide-y divide-border border-t border-border text-sm md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="space-y-2.5 px-5 py-4">
                <p className="font-medium text-foreground">
                  {order.customerName}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs font-medium tabular-nums text-foreground transition-colors hover:bg-[#F6F7F5]"
                    href={`tel:${order.customerPhone}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {order.customerPhone}
                  </a>
                  <a
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                    href={waHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                </div>
                {order.customerEmail ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {order.customerEmail}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5 px-5 py-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  {getDeliveryMethodLabel(order.deliveryMethod)}
                </p>
                {order.deliveryLocation ? (
                  <p>Location: {order.deliveryLocation}</p>
                ) : null}
                {mapUrl ? (
                  <div className="pt-0.5">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Open Map Pin
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
                {cleanDeliveryNotes ? (
                  <p>Delivery note: {cleanDeliveryNotes}</p>
                ) : null}
                {order.customerNotes ? (
                  <p>Customer note: {order.customerNotes}</p>
                ) : null}
              </div>
            </div>

            {/* Items Ledger */}
            {order.items && order.items.length > 0 ? (
              <div className="space-y-1.5 border-t border-border bg-[#F6F7F5]/40 px-5 py-3.5">
                {order.items.map((item) => (
                  <div
                    className="flex justify-between gap-2 text-xs tabular-nums"
                    key={item.id}
                  >
                    <span className="text-muted-foreground">
                      <strong className="font-medium text-foreground">
                        {item.quantity}×
                      </strong>{" "}
                      {item.productName}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatKes(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {errorByOrderId[order.id] ? (
              <div className="border-t border-destructive/30 bg-destructive/10 px-5 py-2.5 text-xs font-medium text-destructive">
                {errorByOrderId[order.id]}
              </div>
            ) : null}

            {/* Step 1: Delivery Quote */}
            {(order.status === "PENDING" ||
              order.status === "REVIEWING_DELIVERY") && (
              <div className="grid gap-2 border-t border-border px-5 py-4 sm:grid-cols-[150px_1fr_auto]">
                <Input
                  className="h-10 bg-white tabular-nums"
                  min="0"
                  placeholder="Delivery fee (KES)"
                  step="1"
                  type="number"
                  value={quote.fee}
                  onChange={(e) =>
                    setQuotesByOrderId((prev) => ({
                      ...prev,
                      [order.id]: { ...quote, fee: e.target.value },
                    }))
                  }
                />
                <Input
                  className="h-10 bg-white"
                  placeholder="Delivery notes (optional)"
                  type="text"
                  value={quote.notes}
                  onChange={(e) =>
                    setQuotesByOrderId((prev) => ({
                      ...prev,
                      [order.id]: { ...quote, notes: e.target.value },
                    }))
                  }
                />
                <Button
                  disabled={isBusy}
                  onClick={() => confirmDelivery(order.id)}
                  className="min-h-10"
                  type="button"
                >
                  Confirm quote
                </Button>
              </div>
            )}

            {/* Step 2: Payment Verification */}
            {payment &&
              (paymentStatus === "PENDING" ||
                paymentStatus === "AWAITING_VERIFICATION") &&
              !isClosed && (
                <div className="grid gap-2 border-t border-border px-5 py-4 sm:grid-cols-[1fr_140px_auto]">
                  <Input
                    className="h-10 bg-white"
                    placeholder={
                      payment.method === "MPESA_BUY_GOODS" ||
                      payment.method === "BANK_TRANSFER"
                        ? "M-Pesa / Bank Ref (e.g. SJK8912P4)"
                        : "Receipt / Reference (optional)"
                    }
                    type="text"
                    value={verifyInput.transactionRef}
                    onChange={(e) =>
                      setVerifyByOrderId((prev) => ({
                        ...prev,
                        [order.id]: {
                          ...verifyInput,
                          transactionRef: e.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    className="h-10 bg-white tabular-nums"
                    min="1"
                    placeholder="Amount (KES)"
                    step="0.01"
                    type="number"
                    value={verifyInput.amount}
                    onChange={(e) =>
                      setVerifyByOrderId((prev) => ({
                        ...prev,
                        [order.id]: { ...verifyInput, amount: e.target.value },
                      }))
                    }
                  />
                  <Button
                    disabled={isBusy}
                    onClick={() => verifyPayment(payment, order)}
                    className="min-h-10"
                    type="button"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Verify & mark paid
                  </Button>
                </div>
              )}

            {/* Step 3: Fulfillment & Cancel */}
            {!isClosed ? (
              <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {canFulfill &&
                    order.status !== "PROCESSING" &&
                    order.status !== "OUT_FOR_DELIVERY" && (
                      <Button
                        disabled={isBusy}
                        onClick={() => updateStatus(order.id, "PROCESSING")}
                        size="sm"
                        type="button"
                        variant="outline"
                        className="min-h-10 bg-white"
                      >
                        <Package className="mr-1.5 h-4 w-4" />
                        Start processing
                      </Button>
                    )}

                  {canFulfill && order.status !== "OUT_FOR_DELIVERY" && (
                    <Button
                      disabled={isBusy}
                      onClick={() =>
                        updateStatus(order.id, "OUT_FOR_DELIVERY")
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                      className="min-h-10 bg-white"
                    >
                      <Truck className="mr-1.5 h-4 w-4" />
                      Out for delivery
                    </Button>
                  )}

                  {canFulfill && (
                    <Button
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, "DELIVERED")}
                      size="sm"
                      type="button"
                      variant="outline"
                      className="min-h-10 bg-white"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Mark delivered
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {cancelConfirmOrderId === order.id ? (
                    <>
                      <Button
                        disabled={isBusy}
                        onClick={() => cancelAndRestoreStock(order.id)}
                        size="sm"
                        type="button"
                        variant="destructive"
                        className="min-h-10"
                      >
                        Confirm cancel & restore stock
                      </Button>
                      <Button
                        disabled={isBusy}
                        onClick={() => setCancelConfirmOrderId(null)}
                        size="sm"
                        type="button"
                        variant="ghost"
                        className="min-h-10"
                      >
                        Keep
                      </Button>
                    </>
                  ) : (
                    <Button
                      disabled={isBusy}
                      onClick={() => setCancelConfirmOrderId(order.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                      className="min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Cancel order
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}