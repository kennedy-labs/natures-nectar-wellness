"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ImageOff,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { OrderActionsMenu } from "@/features/admin/components/OrderActionsMenu";
import type { RecentlyCompletedOrderFlash } from "@/features/admin/hooks/useAdminOrderActions";
import {
  type AdminOrder,
  formatAdminOrderDate,
  getAdminDeliveryLabel,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
  getAdminPaymentMethodLabel,
  getPrimaryActionButtonClasses,
  getToneClasses,
  isDecisionRequiredStage,
  isUndoneOrderStage,
} from "@/features/admin/utils/order-display.utils";
import type { Product } from "@/features/products/types/product.types";
import {
  getNextOrderAction,
  normalizeOrderStage,
  type OrderNextAction,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type AdminActionQueueProps = {
  orders: AdminOrder[];
  products: Product[];
  categoriesCount: number;
  refreshing: boolean;
  busyOrderId: string | null;
  recentlyCompleted: Record<string, RecentlyCompletedOrderFlash>;
  onRefresh: () => Promise<unknown>;
  onOpenOrder: (orderId: string, focusSection?: "quote" | "payment" | null) => void;
  onNextAction: (order: AdminOrder, action: OrderNextAction) => void;
  onCancelOrder: (order: AdminOrder) => void;
  onDeleteOrder: (order: AdminOrder) => void;
  onOpenOrdersTab: (stageFilter?: "undone" | "completed" | UnifiedOrderStage) => void;
  onOpenCatalogFilter: (
    filter: "missing_photo" | "low_stock" | "all",
    productId?: string
  ) => void;
};

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

function ActionIcon({
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

export function AdminActionQueue({
  orders,
  products,
  categoriesCount,
  refreshing,
  busyOrderId,
  recentlyCompleted,
  onRefresh,
  onOpenOrder,
  onNextAction,
  onCancelOrder,
  onDeleteOrder,
  onOpenOrdersTab,
  onOpenCatalogFilter,
}: AdminActionQueueProps) {
  const decisionOrders: AdminOrder[] = [];
  const fulfillmentOrders: AdminOrder[] = [];

  for (const order of orders) {
    const stage = normalizeOrderStage(order);
    const hasFlash = Boolean(recentlyCompleted[order.id]);

    if (isDecisionRequiredStage(stage)) {
      decisionOrders.push(order);
    } else if (stage === "PROCESSING" || stage === "OUT_FOR_DELIVERY") {
      fulfillmentOrders.push(order);
    } else if (hasFlash) {
      // Hold recently completed rows briefly in fulfillment view for clear visual confirmation
      fulfillmentOrders.push(order);
    }
  }

  const activeProducts = products.filter((p) => p.isActive);
  const missingPhotoProducts = activeProducts.filter((p) => !p.image);
  const lowStockProducts = activeProducts.filter((p) => p.stockQuantity <= 5);

  const catalogBlockersMap = new Map<
    string,
    { product: Product; reasons: Array<"missing_photo" | "out_of_stock" | "low_stock"> }
  >();

  for (const product of activeProducts) {
    const reasons: Array<"missing_photo" | "out_of_stock" | "low_stock"> = [];
    if (!product.image) reasons.push("missing_photo");
    if (product.stockQuantity === 0) reasons.push("out_of_stock");
    else if (product.stockQuantity <= 5) reasons.push("low_stock");
    if (reasons.length > 0) {
      catalogBlockersMap.set(product.id, { product, reasons });
    }
  }
  const catalogBlockers = Array.from(catalogBlockersMap.values());

  const undoneOrdersCount = orders.filter((o) =>
    isUndoneOrderStage(normalizeOrderStage(o))
  ).length;
  const deliveredOrdersCount = orders.filter(
    (o) => normalizeOrderStage(o) === "DELIVERED"
  ).length;
  const verifiedRevenue = orders
    .flatMap((o) => o.payments ?? [])
    .filter((p) => p.status === "VERIFIED")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const totalUndoneTasks =
    decisionOrders.filter((o) => !recentlyCompleted[o.id]).length +
    fulfillmentOrders.filter((o) => !recentlyCompleted[o.id]).length +
    catalogBlockers.length;

  const orientationHeadline =
    totalUndoneTasks === 0
      ? "Everything is caught up"
      : `${totalUndoneTasks} task${totalUndoneTasks === 1 ? "" : "s"} waiting for action`;

  const orientationParts: string[] = [];
  if (decisionOrders.length > 0) {
    orientationParts.push(
      `${decisionOrders.length} order${decisionOrders.length === 1 ? "" : "s"} need a quote or payment check`
    );
  }
  if (fulfillmentOrders.length > 0) {
    orientationParts.push(
      `${fulfillmentOrders.length} in fulfillment`
    );
  }
  if (catalogBlockers.length > 0) {
    orientationParts.push(
      `${catalogBlockers.length} catalog item${catalogBlockers.length === 1 ? "" : "s"} need photo or stock attention`
    );
  }

  const orientationSubtext =
    orientationParts.length > 0
      ? orientationParts.join(" · ")
      : "No open orders are waiting on you, and every active product has photos and stock.";

  function renderQueueOrderRow(order: AdminOrder) {
    const statusMeta = getAdminOrderStatusMeta(order);
    const tone = getToneClasses(statusMeta.tone);
    const nextAction = getNextOrderAction(order);
    const flash = recentlyCompleted[order.id];
    const total = getAdminOrderTotal(order);
    const isBusy = busyOrderId === order.id;

    return (
      <div
        key={order.id}
        onClick={() => onOpenOrder(order.id, null)}
        className={cn(
          "flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between",
          flash
            ? "bg-[#1F4E37]/[0.09]"
            : "bg-[#FCFBF8] hover:bg-[#F7F5F0]/80"
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs font-semibold text-[#14221B]">
              {order.orderNumber}
            </span>
            <span aria-hidden="true" className="text-[#55635C]">
              ·
            </span>
            <span className="text-sm font-medium text-[#14221B]">
              {order.customerName}
            </span>
            <span aria-hidden="true" className="text-[#55635C]">
              ·
            </span>
            <span className="text-xs text-[#55635C] tabular-nums">
              {formatAdminOrderDate(order.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#55635C]">
            <span className="truncate">{summarizeItems(order)}</span>
            <span aria-hidden="true">·</span>
            <span>{getAdminDeliveryLabel(order.deliveryMethod)}</span>
            <span aria-hidden="true">·</span>
            <span>{getAdminPaymentMethodLabel(order.preferredPaymentMethod)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-3">
            {flash ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1F4E37]/30 bg-[#1F4E37]/12 px-2.5 py-1 text-xs font-semibold text-[#1F4E37]">
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
                <span>{statusMeta.label}</span>
              </span>
            )}

            <span className="text-sm font-semibold tabular-nums text-[#14221B]">
              {formatKes(total)}
            </span>
          </div>

          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {flash ? (
              <span className="inline-flex h-9 items-center px-2.5 text-xs font-medium text-[#1F4E37]">
                Saved
              </span>
            ) : nextAction ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onNextAction(order, nextAction)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
                  getPrimaryActionButtonClasses(nextAction)
                )}
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ActionIcon
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
              onViewDetails={(target) => onOpenOrder(target.id, null)}
              onNextAction={onNextAction}
              onCancel={onCancelOrder}
              onDelete={onDeleteOrder}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zero-Second Orientation Header */}
      <div className="flex flex-col gap-4 border-b border-[#E3DFD6] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#1F4E37]">
            Action Queue
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight text-[#14221B] text-balance sm:text-3xl">
            {orientationHeadline}
          </h1>
          <p className="text-sm text-[#55635C] tabular-nums">
            {orientationSubtext}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void onRefresh()}
            className="min-h-10 border-[#E3DFD6] bg-[#FCFBF8] text-[#14221B] hover:bg-[#F7F5F0]"
          >
            <RefreshCw
              className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            {refreshing ? "Refreshing..." : "Refresh queue"}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenOrdersTab("undone")}
            className="min-h-10 bg-[#1F4E37] text-[#FCFBF8] hover:bg-[#173B2A]"
          >
            Open Orders
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* All-Caught-Up State when zero tasks remain */}
      {totalUndoneTasks === 0 &&
      decisionOrders.length === 0 &&
      fulfillmentOrders.length === 0 ? (
        <section
          aria-label="Queue clear"
          className="flex flex-col items-center justify-center rounded-xl border border-[#1F4E37]/25 bg-[#FCFBF8] px-6 py-12 text-center"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#1F4E37]/25 bg-[#1F4E37]/10 text-[#1F4E37]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-xl font-medium text-[#14221B]">
            Nothing is waiting on you right now
          </h2>
          <p className="mt-1 max-w-md text-sm text-[#55635C]">
            Every customer order is settled and all active catalog items have
            photos and healthy stock.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenOrdersTab("completed")}
              className="min-h-10 border-[#E3DFD6] bg-[#FCFBF8] text-[#14221B]"
            >
              View completed orders ({deliveredOrdersCount})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenCatalogFilter("all")}
              className="min-h-10 border-[#E3DFD6] bg-[#FCFBF8] text-[#14221B]"
            >
              Browse catalog ({activeProducts.length})
            </Button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          {/* Tier 1: Urgent Decisions (REVIEWING_DELIVERY, AWAITING_PAYMENT) */}
          {decisionOrders.length > 0 ? (
            <section aria-label="Orders needing your decision" className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#92400E]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Needs your decision ({decisionOrders.length})</span>
                  </h2>
                  <p className="text-xs text-[#55635C]">
                    Customers cannot move forward until you set a delivery quote
                    or verify their payment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenOrdersTab("REVIEWING_DELIVERY")}
                  className="text-xs font-medium text-[#92400E] underline-offset-4 hover:underline"
                >
                  Filter in Orders
                </button>
              </div>

              <div className="divide-y divide-[#E3DFD6] overflow-hidden rounded-xl border border-[#F59E0B]/40 bg-[#FCFBF8]">
                {decisionOrders.map(renderQueueOrderRow)}
              </div>
            </section>
          ) : null}

          {/* Tier 2: Ready to Fulfill (PROCESSING, OUT_FOR_DELIVERY) */}
          {fulfillmentOrders.length > 0 ? (
            <section aria-label="Orders in fulfillment" className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14221B]">
                    <Truck className="h-4 w-4 shrink-0 text-[#0369A1]" />
                    <span>Ready to pack &amp; hand over ({fulfillmentOrders.length})</span>
                  </h2>
                  <p className="text-xs text-[#55635C]">
                    Confirmed orders ready to pack, hand to rider, or mark delivered.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenOrdersTab("PROCESSING")}
                  className="text-xs font-medium text-[#1F4E37] underline-offset-4 hover:underline"
                >
                  Filter in Orders
                </button>
              </div>

              <div className="divide-y divide-[#E3DFD6] overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8]">
                {fulfillmentOrders.map(renderQueueOrderRow)}
              </div>
            </section>
          ) : null}

          {/* Tier 3: Catalog Blockers (Missing photos / Out or low stock) */}
          {catalogBlockers.length > 0 ? (
            <section aria-label="Catalog items needing attention" className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#92400E]">
                    <ImageOff className="h-4 w-4 shrink-0" />
                    <span>Catalog attention ({catalogBlockers.length})</span>
                  </h2>
                  <p className="text-xs text-[#55635C]">
                    Active products missing storefront photos or running low on stock.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  {missingPhotoProducts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenCatalogFilter("missing_photo")}
                      className="text-[#92400E] underline-offset-4 hover:underline"
                    >
                      No photo ({missingPhotoProducts.length})
                    </button>
                  ) : null}
                  {lowStockProducts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenCatalogFilter("low_stock")}
                      className="text-[#92400E] underline-offset-4 hover:underline"
                    >
                      Low stock ({lowStockProducts.length})
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="divide-y divide-[#E3DFD6] overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8]">
                {catalogBlockers.slice(0, 6).map(({ product, reasons }) => {
                  const hasMissingPhoto = reasons.includes("missing_photo");
                  const isOut = reasons.includes("out_of_stock");

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#14221B]">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#55635C] tabular-nums">
                          {formatKes(product.price)}
                          {" · "}
                          {hasMissingPhoto ? "Missing photo" : null}
                          {hasMissingPhoto &&
                          (isOut || reasons.includes("low_stock"))
                            ? " · "
                            : null}
                          {isOut
                            ? "Out of stock"
                            : reasons.includes("low_stock")
                              ? `${product.stockQuantity} units left`
                              : null}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onOpenCatalogFilter(
                            hasMissingPhoto ? "missing_photo" : "low_stock",
                            product.id
                          )
                        }
                        className="min-h-9 shrink-0 border-[#F59E0B]/40 bg-[#FFFBEB] text-xs font-medium text-[#92400E] hover:bg-[#FEF3C7]"
                      >
                        {hasMissingPhoto ? "Upload photo" : "Update stock"}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* Subordinate Daily Snapshot */}
      <section aria-label="Daily operational snapshot" className="space-y-2.5 pt-2">
        <h2 className="text-xs font-semibold text-[#55635C]">
          Daily Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#E3DFD6] lg:grid-cols-4">
          <StatsCard
            grouped
            title="Verified Revenue"
            value={formatKes(verifiedRevenue)}
            subtext={`${deliveredOrdersCount} delivered order${deliveredOrdersCount === 1 ? "" : "s"}`}
            tone="success"
          />
          <StatsCard
            grouped
            title="Undone Orders"
            value={undoneOrdersCount}
            subtext={`${decisionOrders.length} needing decision`}
            tone={decisionOrders.length > 0 ? "warning" : "default"}
            onClick={() => onOpenOrdersTab("undone")}
          />
          <StatsCard
            grouped
            title="Active Products"
            value={activeProducts.length}
            subtext={`${categoriesCount} categories`}
            onClick={() => onOpenCatalogFilter("all")}
          />
          <StatsCard
            grouped
            title="Inventory Warnings"
            value={lowStockProducts.length}
            subtext="5 units or fewer"
            tone={lowStockProducts.length > 0 ? "warning" : "default"}
            onClick={() => onOpenCatalogFilter("low_stock")}
          />
        </div>
      </section>
    </div>
  );
}
