"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { CustomerOrderRecord } from "./FeaturedOrderStage";
import { getOrderVisualProfile, isOrderClosed } from "./order-visual-tone";

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function renderRowIcon(
  status: string,
  tone: "delivered" | "active" | "amber" | "alert"
) {
  if (tone === "alert") return <XCircle className="h-4 w-4" />;
  if (tone === "delivered") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "amber") return <Clock className="h-4 w-4" />;
  if (status === "OUT_FOR_DELIVERY") return <Truck className="h-4 w-4" />;
  if (status === "PROCESSING") return <Package className="h-4 w-4" />;
  return <CheckCircle2 className="h-4 w-4" />;
}

type OrderHistoryListProps = {
  orders: CustomerOrderRecord[];
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string) => void;
  onClearClosedOrders?: () => void;
};

export function OrderHistoryList({
  orders,
  selectedOrderId,
  onSelectOrder,
  onClearClosedOrders,
}: OrderHistoryListProps) {
  if (orders.length <= 1) {
    return null;
  }

  const closedCount = orders.filter((order) =>
    isOrderClosed(order.status)
  ).length;

  return (
    <section aria-label="Saved orders" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="font-display text-lg font-medium text-foreground">
            Saved orders
          </h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            ({orders.length})
          </span>
        </div>

        {closedCount > 0 && onClearClosedOrders ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearClosedOrders}
            className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear closed
          </Button>
        ) : null}
      </div>

      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {orders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          const itemCount = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const profile = getOrderVisualProfile({
            status: order.status,
            deliveryMethod: order.deliveryMethod,
            deliveryFee: order.deliveryFee,
            preferredPaymentMethod: order.preferredPaymentMethod,
            paymentStatus: order.payment?.status,
          });

          return (
            <button
              key={order.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectOrder(order.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-150",
                isSelected
                  ? "border-l-2 border-l-primary bg-primary/[0.06]"
                  : "hover:bg-muted/40"
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                    profile.rowBadgeIconClass
                  )}
                >
                  {renderRowIcon(order.status, profile.tone)}
                </span>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {order.orderNumber}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        profile.tone === "alert"
                          ? "text-destructive"
                          : profile.tone === "amber"
                            ? "text-amber-800"
                            : "text-primary"
                      )}
                    >
                      {profile.statusLabel}
                    </span>
                  </div>

                  <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground tabular-nums">
                    <span>{formatShortDate(order.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatKes(order.totalAmount)}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    isSelected
                      ? "translate-x-0.5 text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
