"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKes } from "@/lib/format";

type Payment = {
  id: string;
  method: "MPESA_BUY_GOODS" | "BANK_TRANSFER" | "CASH_ON_PICKUP" | "CASH_ON_DELIVERY";
  status: "PENDING" | "AWAITING_VERIFICATION" | "VERIFIED" | "FAILED" | "REFUNDED";
  amount?: number | null;
  transactionRef?: string | null;
  verifiedAt?: string | null;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
};

type Order = {
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
  createdAt: string;
  items?: OrderItem[];
  payments?: Payment[];
};

function toWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  return digits;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PAID" || status === "DELIVERED") return "default";
  if (status === "CANCELLED") return "destructive";
  if (status === "AWAITING_PAYMENT" || status === "PENDING") return "outline";
  return "secondary";
}

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [expiring, setExpiring] = useState(false);
  const [cancelConfirmOrderId, setCancelConfirmOrderId] = useState<string | null>(null);
  const [errorByOrderId, setErrorByOrderId] = useState<Record<string, string>>({});
  const [quotesByOrderId, setQuotesByOrderId] = useState<
    Record<string, { fee: string; notes: string }>
  >({});
  const [verifyByOrderId, setVerifyByOrderId] = useState<
    Record<string, { transactionRef: string; amount: string }>
  >({});

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data?.data ?? data ?? []);
    setLoading(false);
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
        setOrderError(orderId, payload?.message ?? "Failed to confirm delivery quote.");
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
        setOrderError(orderId, payload?.message ?? "Failed to update order status.");
        return;
      }

      await load();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function verifyPayment(payment: Payment, order: Order) {
    const expectedTotal = order.totalAmount ?? order.subtotalAmount + (order.deliveryFee ?? 0);
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
          payload?.error?.message ?? payload?.message ?? "Payment verification failed."
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
          payload?.error?.message ?? payload?.message ?? "Failed to cancel order."
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading orders...</p>;
  }

  return (
    <div className="w-full max-w-full space-y-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {orders.length} order(s)
        </p>

        <Button
          disabled={expiring}
          onClick={expireOldUnpaidOrders}
          size="sm"
          type="button"
          variant="outline"
        >
          <Clock className="h-4 w-4" />
          {expiring ? "Checking..." : "Expire Unpaid (>24h)"}
        </Button>
      </div>

      {panelMessage ? (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {panelMessage}
        </div>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No orders yet.
        </div>
      ) : null}

      {orders.map((order) => {
        const payment = order.payments?.[0];
        const paymentStatus = payment?.status;
        const isPaid = order.payments?.some((p) => p.status === "VERIFIED") ?? false;
        const isCashOrder =
          order.preferredPaymentMethod === "CASH_ON_PICKUP" ||
          order.preferredPaymentMethod === "CASH_ON_DELIVERY";
        const canFulfill = isPaid || isCashOrder;
        const isClosed = order.status === "DELIVERED" || order.status === "CANCELLED";
        const total = order.totalAmount ?? order.subtotalAmount + (order.deliveryFee ?? 0);
        const isBusy = busyOrderId === order.id;

        const quote = quotesByOrderId[order.id] ?? { fee: "", notes: "" };
        const verifyInput = verifyByOrderId[order.id] ?? {
          transactionRef: "",
          amount: String(total),
        };

        const waMessage = `Hello ${order.customerName}, regarding your Nature's Nectar order ${order.orderNumber} (Total: ${formatKes(total)}).`;
        const waHref = `https://wa.me/${toWhatsAppPhone(order.customerPhone)}?text=${encodeURIComponent(waMessage)}`;

        return (
          <div key={order.id} className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{order.orderNumber}</p>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                  {paymentStatus ? (
                    <Badge variant={paymentStatus === "VERIFIED" ? "default" : "outline"}>
                      Payment: {paymentStatus}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                  {order.preferredPaymentMethod
                    ? ` · ${order.preferredPaymentMethod.replace(/_/g, " ")}`
                    : ""}
                  {payment?.transactionRef ? ` · Ref: ${payment.transactionRef}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-base font-semibold">{formatKes(total)}</p>
                <p className="text-xs text-muted-foreground">
                  Subtotal {formatKes(order.subtotalAmount)}
                  {order.deliveryFee !== null && order.deliveryFee !== undefined
                    ? ` + Delivery ${formatKes(order.deliveryFee)}`
                    : " (Delivery unquoted)"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-md bg-muted/30 p-3 text-sm md:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{order.customerName}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <a
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    href={`tel:${order.customerPhone}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {order.customerPhone}
                  </a>
                  <a
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                    href={waHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp customer
                  </a>
                </div>
                {order.customerEmail ? (
                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                ) : null}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.deliveryMethod.replace(/_/g, " ")}
                </p>
                {order.deliveryLocation ? <p>Location: {order.deliveryLocation}</p> : null}
                {order.deliveryNotes ? <p>Delivery note: {order.deliveryNotes}</p> : null}
                {order.customerNotes ? <p>Customer note: {order.customerNotes}</p> : null}
              </div>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="space-y-1 border-t pt-3 text-sm">
                {order.items.map((item) => (
                  <div className="flex justify-between gap-2 text-xs" key={item.id}>
                    <span>
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-medium">{formatKes(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {errorByOrderId[order.id] ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorByOrderId[order.id]}
              </div>
            ) : null}

            {(order.status === "PENDING" || order.status === "REVIEWING_DELIVERY") && (
              <div className="grid gap-2 border-t pt-3 sm:grid-cols-[140px_1fr_auto]">
                <Input
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
                  placeholder="Delivery quote notes (optional)"
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
                  size="sm"
                  type="button"
                >
                  Confirm Delivery Quote
                </Button>
              </div>
            )}

            {payment &&
              (paymentStatus === "PENDING" || paymentStatus === "AWAITING_VERIFICATION") &&
              !isClosed && (
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-[1fr_140px_auto]">
                  <Input
                    placeholder={
                      payment.method === "MPESA_BUY_GOODS" || payment.method === "BANK_TRANSFER"
                        ? "M-Pesa / Bank Ref (required, e.g. SJK8912P4)"
                        : "Receipt / Reference (optional)"
                    }
                    type="text"
                    value={verifyInput.transactionRef}
                    onChange={(e) =>
                      setVerifyByOrderId((prev) => ({
                        ...prev,
                        [order.id]: { ...verifyInput, transactionRef: e.target.value },
                      }))
                    }
                  />
                  <Input
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
                    size="sm"
                    type="button"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify & Mark Paid
                  </Button>
                </div>
              )}

            {!isClosed ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="flex flex-wrap gap-2">
                  {canFulfill && order.status !== "PROCESSING" && order.status !== "OUT_FOR_DELIVERY" && (
                    <Button
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, "PROCESSING")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Package className="h-4 w-4" />
                      Start Processing
                    </Button>
                  )}

                  {canFulfill && order.status !== "OUT_FOR_DELIVERY" && (
                    <Button
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, "OUT_FOR_DELIVERY")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Truck className="h-4 w-4" />
                      Out for Delivery
                    </Button>
                  )}

                  {canFulfill && (
                    <Button
                      disabled={isBusy}
                      onClick={() => updateStatus(order.id, "DELIVERED")}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Delivered
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
                      >
                        Confirm Cancel & Restore Stock
                      </Button>
                      <Button
                        disabled={isBusy}
                        onClick={() => setCancelConfirmOrderId(null)}
                        size="sm"
                        type="button"
                        variant="ghost"
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
                    >
                      <XCircle className="h-4 w-4 text-destructive" />
                      Cancel Order
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