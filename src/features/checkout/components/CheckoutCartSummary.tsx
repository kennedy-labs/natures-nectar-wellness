"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";

export function CheckoutCartSummary() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());

  if (items.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Your cart is empty</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Add products before proceeding to checkout.
        </p>

        <Button asChild className="mt-4">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            className="flex items-start justify-between gap-4 border-b pb-4"
            key={item.productId}
          >
            <div>
              <p className="font-medium">{item.name}</p>

              <p className="text-sm text-muted-foreground">
                Quantity: {item.quantity}
              </p>
            </div>

            <p className="text-sm font-medium">
              {formatKes(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">Subtotal</p>

        <p className="text-base font-semibold">
          {formatKes(subtotal)}
        </p>
      </div>
    </div>
  );
}