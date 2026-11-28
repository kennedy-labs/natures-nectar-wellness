"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AdminToastInput } from "@/features/admin/components/AdminToastViewport";
import {
  type AdminOrder,
  type AdminOrderPayment,
  getAdminOrderStatusMeta,
} from "@/features/admin/utils/order-display.utils";
import type { OrderNextAction } from "@/features/orders/utils/order-workflow.utils";
import { formatKes } from "@/lib/format";

export type RecentlyCompletedOrderFlash = {
  summary: string;
  targetLabel: string;
};

type UseAdminOrderActionsParams = {
  orders: AdminOrder[];
  onOrdersChange: (orders: AdminOrder[]) => void;
  onToast: (toast: AdminToastInput) => void;
};

const ROW_HIGHLIGHT_MS = 1100;

export function useAdminOrderActions({
  orders,
  onOrdersChange,
  onToast,
}: UseAdminOrderActionsParams) {
  const [refreshing, setRefreshing] = useState(false);
  const [expiring, setExpiring] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [drawerFocusSection, setDrawerFocusSection] = useState<
    "quote" | "payment" | null
  >(null);
  const [orderToCancel, setOrderToCancel] = useState<AdminOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<
    Record<string, RecentlyCompletedOrderFlash>
  >({});

  const flashTimersRef = useRef<Map<string, number>>(new Map());

  const flashOrderCompletion = useCallback(
    (orderId: string, flash: RecentlyCompletedOrderFlash) => {
      const existing = flashTimersRef.current.get(orderId);
      if (existing !== undefined) {
        window.clearTimeout(existing);
      }

      setRecentlyCompleted((prev) => ({
        ...prev,
        [orderId]: flash,
      }));

      const timer = window.setTimeout(() => {
        flashTimersRef.current.delete(orderId);
        setRecentlyCompleted((prev) => {
          if (!(orderId in prev)) return prev;
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
      }, ROW_HIGHLIGHT_MS);

      flashTimersRef.current.set(orderId, timer);
    },
    []
  );

  useEffect(() => {
    const timers = flashTimersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const nextOrders: AdminOrder[] = data?.data ?? data ?? [];
      onOrdersChange(nextOrders);
      return nextOrders;
    } finally {
      setRefreshing(false);
    }
  }, [onOrdersChange]);

  const confirmDeliveryQuote = useCallback(
    async (orderId: string, fee: number, notes: string) => {
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

      const updated: AdminOrder | undefined = payload?.data;
      const nextMeta = updated ? getAdminOrderStatusMeta(updated) : null;
      const orderNum =
        updated?.orderNumber ??
        orders.find((o) => o.id === orderId)?.orderNumber ??
        "Order";

      flashOrderCompletion(orderId, {
        summary: `Quote saved (${formatKes(fee)})`,
        targetLabel: nextMeta ? `Moved to ${nextMeta.label}` : "Quote confirmed",
      });

      onToast({
        tone: "success",
        title: `${orderNum} delivery quote saved`,
        description: nextMeta
          ? `${formatKes(fee)} courier fee set · ${nextMeta.label}`
          : `${formatKes(fee)} courier fee saved.`,
      });

      await load();
    },
    [orders, flashOrderCompletion, onToast, load]
  );

  const updateStatus = useCallback(
    async (orderId: string, status: string, toastTitle?: string) => {
      const targetOrder = orders.find((o) => o.id === orderId);
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

      const updated: AdminOrder | undefined = payload?.data;
      const orderNum = updated?.orderNumber ?? targetOrder?.orderNumber ?? "Order";
      const nextMeta = updated
        ? getAdminOrderStatusMeta(updated)
        : getAdminOrderStatusMeta({
            ...(targetOrder ?? {
              id: orderId,
              orderNumber: orderNum,
              customerName: "",
              customerPhone: "",
              deliveryMethod: "PICKUP",
              subtotalAmount: 0,
              createdAt: new Date(),
            }),
            status,
          });

      flashOrderCompletion(orderId, {
        summary: toastTitle ?? nextMeta.label,
        targetLabel: `Status: ${nextMeta.label}`,
      });

      onToast({
        tone: "success",
        title: toastTitle ?? `${orderNum} moved to ${nextMeta.label}`,
        description: `Database status updated to ${status}.`,
      });

      await load();
    },
    [orders, flashOrderCompletion, onToast, load]
  );

  const handleNextAction = useCallback(
    async (order: AdminOrder, action: OrderNextAction) => {
      if (action.kind === "open_quote" || action.kind === "open_payment") {
        setDrawerFocusSection(action.focusSection);
        setActiveOrderId(order.id);
        return;
      }

      if (busyOrderId) return;
      setBusyOrderId(order.id);

      const toastTitle =
        action.targetStatus === "DELIVERED"
          ? action.autoVerifiesCash
            ? `${order.orderNumber} marked Delivered`
            : `${order.orderNumber} marked Delivered`
          : `${order.orderNumber} moved to ${action.label}`;

      try {
        await updateStatus(order.id, action.targetStatus, toastTitle);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not advance order.";
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code?: unknown }).code ?? "")
            : "";

        if (code === "PAYMENT_REQUIRED") {
          onToast({
            tone: "error",
            title: `Verify payment for ${order.orderNumber}`,
            description: "Payment confirmation is required before advancing.",
          });
          setDrawerFocusSection("payment");
          setActiveOrderId(order.id);
        } else if (code === "DELIVERY_QUOTE_REQUIRED") {
          onToast({
            tone: "error",
            title: `Delivery quote needed for ${order.orderNumber}`,
            description: "Set the courier fee before advancing this order.",
          });
          setDrawerFocusSection("quote");
          setActiveOrderId(order.id);
        } else {
          onToast({
            tone: "error",
            title: `Could not update ${order.orderNumber}`,
            description: message,
          });
        }
      } finally {
        setBusyOrderId(null);
      }
    },
    [busyOrderId, updateStatus, onToast]
  );

  const verifyPayment = useCallback(
    async (
      payment: AdminOrderPayment,
      order: AdminOrder,
      transactionRef: string,
      amount: number
    ) => {
      const res = await fetch(`/api/payments/${payment.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionRef, amount }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          payload?.error?.message ??
            payload?.message ??
            "Payment verification failed."
        );
      }

      flashOrderCompletion(order.id, {
        summary: "Payment verified",
        targetLabel: "Moved to Preparing",
      });

      onToast({
        tone: "success",
        title: `Payment verified for ${order.orderNumber}`,
        description: `${formatKes(amount)} confirmed · Ready to pack in Preparing.`,
      });

      await load();
    },
    [flashOrderCompletion, onToast, load]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      const targetOrder = orders.find((o) => o.id === orderId);
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          payload?.error?.message ?? payload?.message ?? "Failed to cancel order."
        );
      }

      flashOrderCompletion(orderId, {
        summary: "Cancelled",
        targetLabel: "Stock restored",
      });

      onToast({
        tone: "info",
        title: `${targetOrder?.orderNumber ?? "Order"} cancelled`,
        description: "Reserved item stock has been returned to inventory.",
      });

      await load();
    },
    [orders, flashOrderCompletion, onToast, load]
  );

  const deleteOrder = useCallback(
    async (order: AdminOrder) => {
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
      onToast({
        tone: "info",
        title: `${order.orderNumber} deleted`,
        description: restored
          ? "Order removed and reserved item stock restored."
          : "Order record permanently removed.",
      });

      await load();
    },
    [activeOrderId, onToast, load]
  );

  const expireOldUnpaidOrders = useCallback(async () => {
    setExpiring(true);
    try {
      const res = await fetch("/api/orders/expire", { method: "POST" });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        onToast({
          tone: "error",
          title: "Could not expire unpaid orders",
          description:
            payload?.error?.message ?? "Please try again in a moment.",
        });
        return;
      }

      const count = payload?.data?.cancelledCount ?? 0;
      onToast({
        tone: count > 0 ? "success" : "info",
        title:
          count > 0
            ? `Expired ${count} unpaid order${count === 1 ? "" : "s"}`
            : "No overdue unpaid orders",
        description:
          count > 0
            ? "Unpaid orders older than 24h were cancelled and stock restored."
            : "All unpaid orders are still within the 24-hour window.",
      });
      await load();
    } finally {
      setExpiring(false);
    }
  }, [onToast, load]);

  const openOrder = useCallback(
    (orderId: string, focusSection: "quote" | "payment" | null = null) => {
      setDrawerFocusSection(focusSection);
      setActiveOrderId(orderId);
    },
    []
  );

  const closeOrder = useCallback(() => {
    setDrawerFocusSection(null);
    setActiveOrderId(null);
  }, []);

  return {
    refreshing,
    expiring,
    busyOrderId,
    activeOrderId,
    drawerFocusSection,
    orderToCancel,
    orderToDelete,
    recentlyCompleted,
    setOrderToCancel,
    setOrderToDelete,
    openOrder,
    closeOrder,
    load,
    confirmDeliveryQuote,
    updateStatus,
    handleNextAction,
    verifyPayment,
    cancelOrder,
    deleteOrder,
    expireOldUnpaidOrders,
  };
}
