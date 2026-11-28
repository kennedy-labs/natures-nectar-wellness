"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
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
import {
  type AdminToastInput,
  AdminToastViewport,
  useAdminToastQueue,
} from "@/features/admin/components/AdminToastViewport";
import { OrderActionsMenu } from "@/features/admin/components/OrderActionsMenu";
import { useAdminOrderActions } from "@/features/admin/hooks/useAdminOrderActions";
import {
  type AdminOrder,
  type AdminOrderCategory,
  formatAdminOrderDate,
  getAdminDeliveryLabel,
  getAdminOrderCategory,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
  getAdminPaymentMethodLabel,
  getPrimaryActionButtonClasses,
  getToneClasses,
  isUndoneOrderStage,
  ORDER_STAGE_DEFINITIONS,
} from "@/features/admin/utils/order-display.utils";
import {
  getNextOrderAction,
  normalizeOrderStage,
  type OrderNextAction,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type { AdminOrder };

export type OrderViewFilter = "undone" | "completed" | "all" | UnifiedOrderStage;

type AdminOrdersPanelProps = {
  initialOrders?: AdminOrder[];
  onOrdersChange?: (orders: AdminOrder[]) => void;
  selectedOrderId?: string | null;
  onSelectedOrderIdChange?: (orderId: string | null) => void;
  filter?: OrderViewFilter;
  onFilterChange?: (filter: OrderViewFilter) => void;
  sharedActions?: ReturnType<typeof useAdminOrderActions>;
  onToast?: (toast: AdminToastInput) => void;
};

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

function PrimaryActionIcon({
  action,
  deliveryMethod,
}: {
  action: OrderNextAction;
  deliveryMethod: string;
}) {
  if (action.kind === "open_quote") {
    return <MapPin className="h-3.5 w-3.5 shrink-0" />;
  }
  if (action.kind === "open_payment") {
    return <CreditCard className="h-3.5 w-3.5 shrink-0" />;
  }
  if (action.targetStatus === "OUT_FOR_DELIVERY") {
    return deliveryMethod === "PICKUP" ? (
      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
    ) : (
      <Truck className="h-3.5 w-3.5 shrink-0" />
    );
  }
  return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />;
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
  filter: controlledFilter,
  onFilterChange,
  sharedActions,
  onToast,
}: AdminOrdersPanelProps = {}) {
  const [internalOrders, setInternalOrders] = useState<AdminOrder[]>(
    initialOrders ?? []
  );
  const [loading, setLoading] = useState(initialOrders === undefined);
  const [internalFilter, setInternalFilter] =
    useState<OrderViewFilter>("undone");
  const [searchQuery, setSearchQuery] = useState("");

  const orders = initialOrders !== undefined ? initialOrders : internalOrders;
  const handleOrdersUpdate = useCallback(
    (next: AdminOrder[]) => {
      if (onOrdersChange) {
        onOrdersChange(next);
      } else {
        setInternalOrders(next);
      }
    },
    [onOrdersChange]
  );

  const localToastQueue = useAdminToastQueue();
  const emitToast = useCallback(
    (input: AdminToastInput) => {
      if (onToast) {
        onToast(input);
      } else {
        localToastQueue.pushToast(input);
      }
    },
    [onToast, localToastQueue]
  );

  const fallbackActions = useAdminOrderActions({
    orders,
    onOrdersChange: handleOrdersUpdate,
    onToast: emitToast,
  });

  const actions = sharedActions ?? fallbackActions;

  const filter =
    controlledFilter !== undefined ? controlledFilter : internalFilter;
  function setFilter(nextFilter: OrderViewFilter) {
    if (onFilterChange) {
      onFilterChange(nextFilter);
    } else {
      setInternalFilter(nextFilter);
    }
  }

  useEffect(() => {
    if (initialOrders !== undefined) return;
    let cancelled = false;

    void fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const nextOrders: AdminOrder[] = data?.data ?? data ?? [];
        setInternalOrders(nextOrders);
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

  const activeOrderId =
    controlledOrderId !== undefined
      ? controlledOrderId
      : actions.activeOrderId;

  function openOrderDetails(
    orderId: string,
    focusSection: "quote" | "payment" | null = null
  ) {
    actions.openOrder(orderId, focusSection);
    if (onSelectedOrderIdChange) {
      onSelectedOrderIdChange(orderId);
    }
  }

  function closeOrderDetails() {
    actions.closeOrder();
    if (onSelectedOrderIdChange) {
      onSelectedOrderIdChange(null);
    }
  }

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) ?? null,
    [orders, activeOrderId]
  );

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

    const undoneCount =
      counts.REVIEWING_DELIVERY +
      counts.AWAITING_PAYMENT +
      counts.PROCESSING +
      counts.OUT_FOR_DELIVERY;
    const completedCount = counts.DELIVERED + counts.CANCELLED;

    return {
      ...counts,
      undoneCount,
      completedCount,
      deliveredRevenue,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const stage = getAdminOrderCategory(order);
      const keepForFlash = Boolean(actions.recentlyCompleted[order.id]);

      if (!keepForFlash) {
        if (filter === "undone" && !isUndoneOrderStage(stage)) {
          return false;
        }
        if (filter === "completed" && isUndoneOrderStage(stage)) {
          return false;
        }
        if (
          filter !== "undone" &&
          filter !== "completed" &&
          filter !== "all" &&
          stage !== filter
        ) {
          return false;
        }
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
  }, [orders, filter, searchQuery, actions.recentlyCompleted]);

  function toggleStageFilter(stage: UnifiedOrderStage) {
    if (filter === stage) {
      setFilter(isUndoneOrderStage(stage) ? "undone" : "completed");
      return;
    }
    setFilter(stage);
  }

  if (loading) {
    return <AdminOrdersListSkeleton />;
  }

  const undoneStages = ORDER_STAGE_DEFINITIONS.filter(
    (s) => s.bucket === "undone"
  );
  const completedStages = ORDER_STAGE_DEFINITIONS.filter(
    (s) => s.bucket === "completed"
  );

  const isUndoneScopeActive =
    filter === "undone" ||
    (filter !== "all" &&
      filter !== "completed" &&
      isUndoneOrderStage(filter));
  const isCompletedScopeActive =
    filter === "completed" ||
    (filter !== "all" &&
      filter !== "undone" &&
      !isUndoneOrderStage(filter));

  return (
    <div className="space-y-4">
      {/* Primary Framing: Undone vs Completed + Search & Maintenance */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E3DFD6] bg-[#FCFBF8] p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="Order completion filter"
              className="inline-flex rounded-lg border border-[#E3DFD6] bg-[#F7F5F0] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isUndoneScopeActive}
                onClick={() => setFilter("undone")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-md px-3.5 text-xs font-semibold tabular-nums transition-colors whitespace-nowrap",
                  filter === "undone"
                    ? "bg-[#1F4E37] text-[#FCFBF8] shadow-xs"
                    : isUndoneScopeActive
                      ? "bg-[#FCFBF8] text-[#14221B]"
                      : "text-[#55635C] hover:text-[#14221B]"
                )}
              >
                <span>Undone</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px]",
                    filter === "undone"
                      ? "bg-white/15 text-[#FCFBF8]"
                      : summary.undoneCount > 0
                        ? "bg-[#FFFBEB] text-[#B45309]"
                        : "bg-black/5 text-[#55635C]"
                  )}
                >
                  {summary.undoneCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isCompletedScopeActive}
                onClick={() => setFilter("completed")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-md px-3.5 text-xs font-semibold tabular-nums transition-colors whitespace-nowrap",
                  filter === "completed"
                    ? "bg-[#14221B] text-[#FCFBF8] shadow-xs"
                    : isCompletedScopeActive
                      ? "bg-[#FCFBF8] text-[#14221B]"
                      : "text-[#55635C] hover:text-[#14221B]"
                )}
              >
                <span>Completed</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px]",
                    filter === "completed"
                      ? "bg-white/15 text-[#FCFBF8]"
                      : "bg-black/5 text-[#55635C]"
                  )}
                >
                  {summary.completedCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={filter === "all"}
                onClick={() => setFilter("all")}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium tabular-nums transition-colors whitespace-nowrap",
                  filter === "all"
                    ? "bg-[#14221B] text-[#FCFBF8] shadow-xs"
                    : "text-[#55635C] hover:text-[#14221B]"
                )}
              >
                <span>All</span>
                <span className="text-[11px] opacity-80">{orders.length}</span>
              </button>
            </div>

            <span className="text-xs text-[#55635C]">
              {isUndoneScopeActive
                ? "Open orders requiring quote, verification, packing, or delivery."
                : isCompletedScopeActive
                  ? "Delivered & cancelled archive."
                  : "All orders across every database status."}
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#55635C]" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search #, customer, item..."
                className="h-9 border-[#E3DFD6] bg-[#F7F5F0]/70 pl-8 pr-8 text-xs text-[#14221B] placeholder:text-[#55635C]"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[#55635C] hover:text-[#14221B]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                disabled={actions.refreshing}
                onClick={() => void actions.load()}
                size="sm"
                type="button"
                variant="outline"
                className="h-9 flex-1 border-[#E3DFD6] bg-[#FCFBF8] px-2.5 text-xs text-[#14221B] hover:bg-[#F7F5F0] sm:flex-initial"
              >
                <RefreshCw
                  className={cn(
                    "mr-1.5 h-3.5 w-3.5",
                    actions.refreshing && "animate-spin"
                  )}
                />
                {actions.refreshing ? "Refreshing" : "Refresh"}
              </Button>

              <Button
                disabled={actions.expiring}
                onClick={() => void actions.expireOldUnpaidOrders()}
                size="sm"
                type="button"
                variant="outline"
                className="h-9 flex-1 border-[#E3DFD6] bg-[#FCFBF8] px-2.5 text-xs text-[#14221B] hover:bg-[#F7F5F0] sm:flex-initial"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                {actions.expiring ? "Checking..." : "Expire >24h"}
              </Button>
            </div>
          </div>
        </div>

        {/* 1-to-1 Database Status Strip Grouped into Undone (4) & Completed (2) */}
        <div className="grid gap-3 border-t border-[#E3DFD6] pt-3 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#55635C]">
              Undone workflow (database stages 1–4)
            </p>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3DFD6] bg-[#E3DFD6] sm:grid-cols-4">
              {undoneStages.map((stageDef) => {
                const count = summary[stageDef.key];
                const tone = getToneClasses(stageDef.tone);
                const active = filter === stageDef.key;

                return (
                  <button
                    key={stageDef.key}
                    type="button"
                    onClick={() => toggleStageFilter(stageDef.key)}
                    className={cn(
                      "flex flex-col justify-between bg-[#FCFBF8] px-3 py-2.5 text-left transition-colors hover:bg-[#F7F5F0]",
                      active && tone.activeStageClass
                    )}
                  >
                    <span className="truncate text-xs font-medium text-[#14221B]">
                      {stageDef.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 font-display text-xl font-medium tabular-nums",
                        count > 0 ? tone.countClass : "text-[#55635C]"
                      )}
                    >
                      {count}
                    </span>
                    <span className="mt-0.5 truncate text-[11px] text-[#55635C]">
                      {stageDef.shortMeaning}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[#55635C]">
              Completed / Closed (stages 5–6)
            </p>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3DFD6] bg-[#E3DFD6]">
              {completedStages.map((stageDef) => {
                const count = summary[stageDef.key];
                const tone = getToneClasses(stageDef.tone);
                const active = filter === stageDef.key;

                return (
                  <button
                    key={stageDef.key}
                    type="button"
                    onClick={() => toggleStageFilter(stageDef.key)}
                    className={cn(
                      "flex flex-col justify-between bg-[#FCFBF8] px-3 py-2.5 text-left transition-colors hover:bg-[#F7F5F0]",
                      active && tone.activeStageClass
                    )}
                  >
                    <span className="truncate text-xs font-medium text-[#14221B]">
                      {stageDef.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 font-display text-xl font-medium tabular-nums",
                        count > 0 ? tone.countClass : "text-[#55635C]"
                      )}
                    >
                      {count}
                    </span>
                    <span className="mt-0.5 truncate text-[11px] text-[#55635C]">
                      {stageDef.key === "DELIVERED" && summary.deliveredRevenue > 0
                        ? formatKes(summary.deliveredRevenue)
                        : stageDef.shortMeaning}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E3DFD6] bg-[#FCFBF8] px-6 py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E3DFD6] bg-[#F7F5F0] text-[#1F4E37]">
            {filter === "undone" && orders.length > 0 ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <ShoppingBag className="h-5 w-5 text-[#55635C]" />
            )}
          </div>
          <p className="mt-3 font-display text-lg font-medium text-[#14221B]">
            {orders.length === 0
              ? "No customer orders yet"
              : filter === "undone" && !searchQuery
                ? "No undone orders remaining"
                : "No orders match this view"}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#55635C]">
            {orders.length === 0
              ? "When customers complete checkout on the storefront, their orders will appear here for review and dispatch."
              : filter === "undone" && !searchQuery
                ? "Every open order has been fulfilled. Switch to Completed or All to review past orders."
                : "Try clearing your search or switching to another status category."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filter === "undone" && summary.completedCount > 0 && !searchQuery ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilter("completed")}
                className="h-9 border-[#E3DFD6] bg-[#FCFBF8] text-xs text-[#14221B]"
              >
                View completed orders ({summary.completedCount})
              </Button>
            ) : null}
            {filter !== "all" || searchQuery ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilter("all");
                  setSearchQuery("");
                }}
                className="h-9 border-[#E3DFD6] bg-[#FCFBF8] text-xs text-[#14221B]"
              >
                Show all orders
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8]">
          {/* Desktop Compact List Table (md+) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E3DFD6] bg-[#F7F5F0] text-[11px] font-semibold tracking-wide text-[#55635C]">
                  <th className="py-2.5 pl-4 pr-3">Order</th>
                  <th className="px-3 py-2.5">Customer &amp; Items</th>
                  <th className="px-3 py-2.5">Channel</th>
                  <th className="px-3 py-2.5">Database Status</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DFD6]">
                {filteredOrders.map((order) => {
                  const stage = normalizeOrderStage(order);
                  const total = getAdminOrderTotal(order);
                  const statusMeta = getAdminOrderStatusMeta(order);
                  const tone = getToneClasses(statusMeta.tone);
                  const nextAction = getNextOrderAction(order);
                  const flash = actions.recentlyCompleted[order.id];
                  const isBusy = actions.busyOrderId === order.id;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrderDetails(order.id, null)}
                      className={cn(
                        "group cursor-pointer transition-colors duration-200",
                        flash
                          ? "bg-[#1F4E37]/[0.09]"
                          : "hover:bg-[#F7F5F0]/85"
                      )}
                    >
                      <td className="whitespace-nowrap py-3 pl-4 pr-3 align-middle">
                        <p className="font-mono text-xs font-semibold text-[#14221B]">
                          {order.orderNumber}
                        </p>
                        <p className="text-[11px] text-[#55635C] tabular-nums">
                          {formatAdminOrderDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="max-w-[260px] px-3 py-3 align-middle">
                        <p className="truncate text-[13px] font-medium text-[#14221B]">
                          {order.customerName}
                        </p>
                        <p className="truncate text-xs text-[#55635C]">
                          {summarizeItems(order)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-middle text-xs">
                        <p className="font-medium text-[#14221B]">
                          {getAdminDeliveryLabel(order.deliveryMethod)}
                        </p>
                        <p className="text-[11px] text-[#55635C]">
                          {getAdminPaymentMethodLabel(
                            order.preferredPaymentMethod
                          )}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 align-middle">
                        {flash ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1F4E37]/30 bg-[#1F4E37]/12 px-2 py-0.5 text-xs font-semibold text-[#1F4E37]">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span>{flash.targetLabel}</span>
                            </span>
                            <span className="text-[11px] text-[#1F4E37]">
                              {flash.summary}
                            </span>
                          </div>
                        ) : (
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
                            <span className="text-[11px] text-[#55635C]">
                              {statusMeta.nextActionHint}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right align-middle tabular-nums">
                        <p className="text-[13px] font-semibold text-[#14221B]">
                          {formatKes(total)}
                        </p>
                        {stage === "REVIEWING_DELIVERY" ? (
                          <p className="text-[11px] font-medium text-[#B45309]">
                            Quote needed
                          </p>
                        ) : null}
                      </td>

                      <td
                        className="whitespace-nowrap py-3 pl-3 pr-4 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {flash ? (
                            <span className="inline-flex h-9 items-center px-2.5 text-xs font-semibold text-[#1F4E37]">
                              Done
                            </span>
                          ) : nextAction ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void actions.handleNextAction(order, nextAction)
                              }
                              className={cn(
                                "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
                                getPrimaryActionButtonClasses(nextAction)
                              )}
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PrimaryActionIcon
                                  action={nextAction}
                                  deliveryMethod={order.deliveryMethod}
                                />
                              )}
                              <span>{nextAction.label}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openOrderDetails(order.id, null)}
                              className="inline-flex h-9 items-center rounded-md border border-[#E3DFD6] bg-[#FCFBF8] px-3 text-xs font-medium text-[#14221B] transition-colors hover:bg-[#F7F5F0]"
                            >
                              Details
                            </button>
                          )}

                          <OrderActionsMenu
                            order={order}
                            busy={isBusy}
                            variant="overflow"
                            onViewDetails={(target) =>
                              openOrderDetails(target.id, null)
                            }
                            onNextAction={(target, action) =>
                              void actions.handleNextAction(target, action)
                            }
                            onCancel={(target) =>
                              actions.setOrderToCancel(target)
                            }
                            onDelete={(target) =>
                              actions.setOrderToDelete(target)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Compact Actionable Rows (< md) */}
          <div className="divide-y divide-[#E3DFD6] md:hidden">
            {filteredOrders.map((order) => {
              const stage = normalizeOrderStage(order);
              const total = getAdminOrderTotal(order);
              const statusMeta = getAdminOrderStatusMeta(order);
              const tone = getToneClasses(statusMeta.tone);
              const nextAction = getNextOrderAction(order);
              const flash = actions.recentlyCompleted[order.id];
              const isBusy = actions.busyOrderId === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => openOrderDetails(order.id, null)}
                  className={cn(
                    "cursor-pointer space-y-2.5 p-3.5 transition-colors duration-200",
                    flash
                      ? "bg-[#1F4E37]/[0.09]"
                      : "hover:bg-[#F7F5F0]/80"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono text-xs font-semibold text-[#14221B]">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-[#55635C] tabular-nums">
                          · {formatAdminOrderDate(order.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-[#14221B]">
                        {order.customerName}
                      </p>
                      <p className="truncate text-xs text-[#55635C]">
                        {summarizeItems(order)} ·{" "}
                        {getAdminDeliveryLabel(order.deliveryMethod)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right tabular-nums">
                      <p className="text-sm font-semibold text-[#14221B]">
                        {formatKes(total)}
                      </p>
                      <p className="text-[11px] text-[#55635C]">
                        {getAdminPaymentMethodLabel(
                          order.preferredPaymentMethod
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {flash ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1F4E37]/30 bg-[#1F4E37]/12 px-2 py-0.5 text-xs font-semibold text-[#1F4E37]">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{flash.targetLabel}</span>
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                          tone.badgeClass
                        )}
                      >
                        <StatusGlyph stage={stage} />
                        <span>{statusMeta.label}</span>
                      </span>
                    )}

                    <div
                      className="flex shrink-0 items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!flash && nextAction ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void actions.handleNextAction(order, nextAction)
                          }
                          className={cn(
                            "inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-60",
                            getPrimaryActionButtonClasses(nextAction)
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PrimaryActionIcon
                              action={nextAction}
                              deliveryMethod={order.deliveryMethod}
                            />
                          )}
                          <span>{nextAction.label}</span>
                        </button>
                      ) : null}

                      <OrderActionsMenu
                        order={order}
                        busy={isBusy}
                        variant="overflow"
                        onViewDetails={(target) =>
                          openOrderDetails(target.id, null)
                        }
                        onNextAction={(target, action) =>
                          void actions.handleNextAction(target, action)
                        }
                        onCancel={(target) => actions.setOrderToCancel(target)}
                        onDelete={(target) => actions.setOrderToDelete(target)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standalone Fallbacks when Panel is used outside AdminDashboardTabs */}
      {!sharedActions ? (
        <>
          <AdminOrderDetailSheet
            order={activeOrder}
            focusSection={actions.drawerFocusSection}
            onClose={closeOrderDetails}
            onConfirmDeliveryQuote={actions.confirmDeliveryQuote}
            onUpdateStatus={actions.updateStatus}
            onVerifyPayment={actions.verifyPayment}
            onCancelOrder={actions.cancelOrder}
            onDeleteOrder={actions.deleteOrder}
          />
          <AdminCancelOrderDialog
            order={actions.orderToCancel}
            onClose={() => actions.setOrderToCancel(null)}
            onConfirmCancel={async (target) => {
              await actions.cancelOrder(target.id);
            }}
          />
          <AdminDeleteOrderDialog
            order={actions.orderToDelete}
            onClose={() => actions.setOrderToDelete(null)}
            onConfirmDelete={actions.deleteOrder}
          />
          <AdminToastViewport
            toasts={localToastQueue.toasts}
            onDismiss={localToastQueue.dismissToast}
          />
        </>
      ) : null}
    </div>
  );
}