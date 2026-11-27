"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

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
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-medium text-foreground">
          Your bag is empty
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add botanical formulations before proceeding to checkout.
        </p>
        <Button asChild className="mt-4 min-h-10 w-full sm:w-auto">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Order summary"
      className="rounded-xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-24"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-border pb-4">
        <h2 className="font-display text-xl font-medium text-foreground">
          Order summary
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.reduce((sum, i) => sum + i.quantity, 0)} items
        </span>
      </div>

      <ul className="divide-y divide-border/75">
        {items.map((item) => (
          <li
            className="flex items-start justify-between gap-4 py-3.5"
            key={item.productId}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {item.quantity} × {formatKes(item.price)}
              </p>
            </div>

            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
              {formatKes(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="space-y-2.5 border-t border-border pt-4 text-sm">
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
                : "text-xs font-medium text-amber-700"
            }
          >
            {deliveryFeeText}
          </span>
        </div>

        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <p className="font-medium text-foreground">Total</p>
          <p className="font-display text-2xl font-medium tabular-nums text-foreground">
            {formatKes(subtotal)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-border/75 pt-4 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Protected by verified M-Pesa STK confirmation and personal Nairobi
          fulfillment support.
        </span>
      </div>
    </aside>
  );
}