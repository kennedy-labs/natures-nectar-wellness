"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { CustomerOrderRecord } from "./FeaturedOrderStage";
import { getOrderVisualProfile } from "./order-visual-tone";

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
};

export function OrderHistoryList({
  orders,
  selectedOrderId,
  onSelectOrder,
}: OrderHistoryListProps) {
  if (orders.length <= 1) {
    return null;
  }

  return (
    <section aria-label="All saved orders" className="space-y-3 pt-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-medium text-foreground">
          All orders on this browser
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {orders.length} orders
        </span>
      </div>

      <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(24,42,32,0.04)]">
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
                "flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-150 sm:px-6",
                isSelected
                  ? "bg-primary/[0.06]"
                  : "hover:bg-muted/40"
              )}
            >
              <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:mt-0",
                    profile.rowBadgeIconClass
                  )}
                >
                  {renderRowIcon(order.status, profile.tone)}
                </span>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-mono text-sm font-semibold text-foreground">
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
                    {isSelected ? (
                      <span className="text-xs text-muted-foreground">
                        · Viewing above
                      </span>
                    ) : null}
                  </div>

                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatShortDate(order.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={profile.paymentTextClass}>
                      {profile.paymentLabel}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <span className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
                  {formatKes(order.totalAmount)}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    isSelected
                      ? "text-primary"
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
