"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { RefreshCw, Search, ShoppingBag } from "lucide-react";

import { useWhatsAppContext } from "@/components/layout/WhatsAppContext";
import { CustomerOrdersSkeleton } from "@/components/skeletons/StorefrontSkeletons";
import { Button } from "@/components/ui/button";
import {
  createCancelledOrderRefundWhatsappMessage,
  createMinimalOrderWhatsappMessage,
  createOrdersPageHelpMessage,
} from "@/features/whatsapp/utils/whatsapp.utils";
import { readApiData } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "@/store/orders.store";

import { CancelOrderDialog } from "./CancelOrderDialog";
import {
  type CustomerOrderRecord,
  FeaturedOrderStage,
} from "./FeaturedOrderStage";
import { OrderHistoryList } from "./OrderHistoryList";
import { isOrderClosed } from "./order-visual-tone";

const emptySubscribe = () => () => {};

type CustomerOrdersViewProps = {
  initialOrderNumber?: string;
};

export function CustomerOrdersView({
  initialOrderNumber,
}: CustomerOrdersViewProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const savedRefs = useOrdersStore((state) => state.orders);
  const saveOrderRef = useOrdersStore((state) => state.saveOrderRef);
  const removeOrderRef = useOrdersStore((state) => state.removeOrderRef);
  const removeOrderRefs = useOrdersStore((state) => state.removeOrderRefs);

  const { setContextMessage } = useWhatsAppContext();
  const [orders, setOrders] = useState<CustomerOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelTargetOrder, setCancelTargetOrder] =
    useState<CustomerOrderRecord | null>(null);

  const [lookupOpen, setLookupOpen] = useState(Boolean(initialOrderNumber));
  const [lookupOrderNumber, setLookupOrderNumber] = useState(
    initialOrderNumber ?? ""
  );
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const featuredOrder =
    orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;

  const activeOrdersWhatsappMessage = featuredOrder
    ? featuredOrder.status === "CANCELLED" &&
      featuredOrder.payment?.status === "VERIFIED"
      ? createCancelledOrderRefundWhatsappMessage({
          orderNumber: featuredOrder.orderNumber,
          customerName: featuredOrder.customerName,
        })
      : createMinimalOrderWhatsappMessage({
          orderNumber: featuredOrder.orderNumber,
          customerName: featuredOrder.customerName,
          deliveryMethod: featuredOrder.deliveryMethod,
          deliveryLocation: featuredOrder.deliveryLocation,
          paymentStatus: featuredOrder.payment?.status,
          preferredPaymentMethod: featuredOrder.preferredPaymentMethod,
          isPaid: featuredOrder.payment?.status === "VERIFIED",
        })
    : createOrdersPageHelpMessage();

  useEffect(() => {
    setContextMessage(activeOrdersWhatsappMessage);
    return () => {
      setContextMessage(null);
    };
  }, [activeOrdersWhatsappMessage, setContextMessage]);

  const refsKey = JSON.stringify(
    savedRefs.map((ref) => ({
      orderNumber: ref.orderNumber,
      phone: ref.phone,
    }))
  );

  const fetchOrdersFromApi = useCallback(async (refsPayload: string) => {
    const res = await fetch("/api/orders/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"refs":${refsPayload}}`,
    });

    return readApiData<CustomerOrderRecord[]>(res);
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
        setSelectedOrderId((prev) => {
          if (prev && data.some((order) => order.id === prev)) return prev;
          if (initialOrderNumber) {
            const matched = data.find(
              (order) => order.orderNumber === initialOrderNumber
            );
            if (matched) return matched.id;
          }
          return data[0]?.id ?? null;
        });
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
  }, [
    isClient,
    savedRefs.length,
    refsKey,
    fetchOrdersFromApi,
    initialOrderNumber,
  ]);

  async function handleRefresh() {
    if (!isClient || savedRefs.length === 0) return;
    setRefreshing(true);
    setError(null);
    setNotice(null);

    try {
      const data = await fetchOrdersFromApi(refsKey);
      setOrders(data);
      setSelectedOrderId((prev) =>
        prev && data.some((order) => order.id === prev)
          ? prev
          : (data[0]?.id ?? null)
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

  async function handleLookupSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanedOrder = lookupOrderNumber.trim().toUpperCase();
    const cleanedPhone = lookupPhone.trim();

    if (cleanedOrder.length < 4 || cleanedPhone.length < 7) {
      setLookupError(
        "Enter both your order number (e.g. NNW-...) and the phone number used at checkout."
      );
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setNotice(null);

    try {
      const matched = await fetchOrdersFromApi(
        JSON.stringify([{ orderNumber: cleanedOrder, phone: cleanedPhone }])
      );

      if (matched.length === 0) {
        setLookupError(
          "No confirmed order matched that order number and phone number."
        );
        return;
      }

      const found = matched[0];
      setOrders((prev) => [
        found,
        ...prev.filter((existing) => existing.id !== found.id),
      ]);
      setLoading(false);
      saveOrderRef({ orderNumber: found.orderNumber, phone: cleanedPhone });
      setSelectedOrderId(found.id);
      setLookupPhone("");
      setLookupOpen(false);
    } catch (err) {
      setLookupError(
        err instanceof Error
          ? err.message
          : "Could not look up your order right now."
      );
    } finally {
      setLookupLoading(false);
    }
  }

  function handleSelectHistoryOrder(orderId: string) {
    setSelectedOrderId(orderId);
    setNotice(null);
    const stageEl = document.getElementById("featured-order-stage");
    if (stageEl && window.innerWidth < 1024) {
      const rect = stageEl.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.45) {
        stageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function handleCancelSuccess(updatedOrder: CustomerOrderRecord) {
    setOrders((prev) =>
      prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
    );
    setSelectedOrderId(updatedOrder.id);
    setCancelTargetOrder(null);
    setError(null);
    setNotice(
      updatedOrder.payment?.status === "VERIFIED"
        ? `Order ${updatedOrder.orderNumber} has been cancelled. Message us on WhatsApp to arrange your M-Pesa refund.`
        : `Order ${updatedOrder.orderNumber} has been cancelled and items were returned to stock.`
    );
  }

  function handleRemoveClosedOrder(order: CustomerOrderRecord) {
    if (!isOrderClosed(order.status)) return;

    removeOrderRef(order.orderNumber);
    const remaining = orders.filter((existing) => existing.id !== order.id);
    setOrders(remaining);
    setSelectedOrderId((prev) =>
      prev === order.id ? (remaining[0]?.id ?? null) : prev
    );
    setNotice(
      `Removed ${order.orderNumber} from this device. You can look it up again anytime with your order number and phone.`
    );
  }

  function handleClearClosedOrders() {
    const closedOrders = orders.filter((order) => isOrderClosed(order.status));
    if (closedOrders.length === 0) return;

    removeOrderRefs(closedOrders.map((order) => order.orderNumber));
    const remaining = orders.filter((order) => !isOrderClosed(order.status));
    setOrders(remaining);
    setSelectedOrderId((prev) =>
      prev && remaining.some((order) => order.id === prev)
        ? prev
        : (remaining[0]?.id ?? null)
    );
    setNotice(
      `Removed ${closedOrders.length} closed ${closedOrders.length === 1 ? "order" : "orders"} from this device.`
    );
  }

  const cancelTargetPhone = cancelTargetOrder
    ? (savedRefs.find(
        (ref) =>
          ref.orderNumber.toUpperCase() ===
          cancelTargetOrder.orderNumber.toUpperCase()
      )?.phone ?? null)
    : null;

  function renderLookupCard(compactHeading?: boolean) {
    return (
      <form
        onSubmit={handleLookupSubmit}
        className="rounded-xl border border-border bg-card p-5 text-left sm:p-6"
      >
        <div className="space-y-1">
          <h2
            className={cn(
              "font-display font-medium text-foreground",
              compactHeading ? "text-lg" : "text-xl"
            )}
          >
            Find an order from another device
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Enter your order number and checkout phone number to inspect live
            fulfillment and receipt details.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="lookup-order-number"
              className="text-xs font-medium text-foreground"
            >
              Order number
            </label>
            <input
              id="lookup-order-number"
              type="text"
              value={lookupOrderNumber}
              onChange={(e) => setLookupOrderNumber(e.target.value)}
              placeholder="e.g. NNW-MI4K9-AB12"
              autoComplete="off"
              className="h-11 w-full rounded-md border border-input bg-background px-3 font-mono text-base uppercase transition-colors placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lookup-phone"
              className="text-xs font-medium text-foreground"
            >
              Checkout phone number
            </label>
            <input
              id="lookup-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10 md:text-sm"
            />
          </div>
        </div>

        {lookupError ? (
          <p className="mt-3 text-xs font-medium text-destructive">
            {lookupError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button
            type="submit"
            disabled={lookupLoading}
            className="min-h-10 w-full gap-1.5 sm:w-auto"
          >
            <Search className="h-4 w-4" />
            {lookupLoading ? "Checking order..." : "Find order"}
          </Button>
          {savedRefs.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setLookupOpen(false);
                setLookupError(null);
              }}
              className="min-h-10 w-full sm:w-auto"
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    );
  }

  if (!isClient) {
    return <CustomerOrdersSkeleton />;
  }

  if (savedRefs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            {notice}
          </div>
        ) : null}

        {renderLookupCard(false)}

        <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-primary">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-display text-lg font-medium text-foreground">
            New to Nature&apos;s Nectar?
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Orders placed on this device appear here automatically.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-5 min-h-10 w-full sm:w-auto"
          >
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return <CustomerOrdersSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            {notice}
          </div>
        ) : null}

        {renderLookupCard(false)}

        <div className="rounded-xl border border-border bg-card p-6 text-center sm:p-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            No confirmed orders were found for this browser yet.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-4 min-h-10 w-full sm:w-auto"
          >
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasMultipleOrders = orders.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {orders.length === 1
            ? "Showing your latest order below."
            : `Viewing ${featuredOrder?.orderNumber ?? "latest order"} · ${orders.length} saved on this device`}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLookupOpen((open) => !open);
              setLookupError(null);
            }}
            className="min-h-9 shrink-0 gap-1.5 bg-card"
          >
            <Search className="h-3.5 w-3.5" />
            Find another order
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={handleRefresh}
            className="min-h-9 shrink-0 gap-1.5 bg-card"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {lookupOpen ? renderLookupCard(true) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-rose-50 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {hasMultipleOrders ? (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <OrderHistoryList
              orders={orders}
              selectedOrderId={featuredOrder?.id ?? null}
              onSelectOrder={handleSelectHistoryOrder}
              onClearClosedOrders={handleClearClosedOrders}
            />
          </div>
          <div className="lg:col-span-8">
            {featuredOrder ? (
              <FeaturedOrderStage
                order={featuredOrder}
                onRequestCancel={(target) => setCancelTargetOrder(target)}
                onRemoveClosedOrder={handleRemoveClosedOrder}
              />
            ) : null}
          </div>
        </div>
      ) : featuredOrder ? (
        <FeaturedOrderStage
          order={featuredOrder}
          onRequestCancel={(target) => setCancelTargetOrder(target)}
          onRemoveClosedOrder={handleRemoveClosedOrder}
        />
      ) : null}

      <CancelOrderDialog
        order={cancelTargetOrder}
        checkoutPhone={cancelTargetPhone}
        onClose={() => setCancelTargetOrder(null)}
        onCancelled={handleCancelSuccess}
      />
    </div>
  );
}
