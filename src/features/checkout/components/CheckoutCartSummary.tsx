"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { CheckoutSummarySkeleton } from "@/components/skeletons/StorefrontSkeletons";
import { Button } from "@/components/ui/button";
import type { DeliveryMethod } from "@/features/checkout/types/checkout.types";
import { getDeliveryFeeSummary } from "@/features/orders/utils/order.utils";
import { formatKes } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};

type CheckoutCartSummaryProps = {
  deliveryMethod?: DeliveryMethod;
};

export function CheckoutCartSummary({
  deliveryMethod = "PICKUP",
}: CheckoutCartSummaryProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const rawItems = useCartStore((state) => state.items);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());

  if (!isClient) {
    return <CheckoutSummarySkeleton />;
  }

  const items = rawItems;
  const subtotal = rawSubtotal;
  const isFreeZone =
    deliveryMethod === "PICKUP" || deliveryMethod === "LOCAL_DELIVERY";
  const deliveryFeeText = getDeliveryFeeSummary(deliveryMethod, null);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-6">
        <h2 className="font-display text-xl font-medium text-foreground">
          Your cart is empty
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Add products before proceeding to checkout.
        </p>

        <Button asChild className="mt-4 min-h-11 w-full sm:w-auto">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-6">
      <h2 className="font-display text-xl font-medium text-foreground">
        Order summary
      </h2>

      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div
            className="flex items-start justify-between gap-4 border-b border-border/70 pb-4 last:border-b-0 last:pb-0"
            key={item.productId}
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.name}</p>

              <p className="text-sm text-muted-foreground tabular-nums">
                Quantity: {item.quantity}
              </p>
            </div>

            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatKes(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-border/80 pt-4 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums text-foreground">
            {formatKes(subtotal)}
          </span>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span>Delivery</span>
          <span
            className={
              isFreeZone
                ? "font-medium text-primary"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {deliveryFeeText}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border/70 pt-3">
          <p className="font-medium text-foreground">Total</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {formatKes(subtotal)}
          </p>
        </div>
      </div>
    </div>
  );
}