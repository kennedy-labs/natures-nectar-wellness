"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartButton } from "@/features/cart/components/CartButton";
import { formatKes } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawItems = useCartStore((state) => state.items);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const items = isClient ? rawItems : [];
  const subtotal = isClient ? rawSubtotal : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <CartButton />
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col bg-background px-4 py-5 sm:max-w-md sm:p-6">
        <SheetHeader>
          <SheetTitle className="font-display text-xl font-medium">Your cart</SheetTitle>
          <SheetDescription>
            Review items before checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 space-y-4 overflow-auto pr-2">
          {items.length === 0 ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                className="grid gap-3 rounded-lg border bg-card p-4"
                key={item.productId}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      className="font-medium hover:underline"
                      href={`/products/${item.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKes(item.price)} · Stock: {item.stockQuantity}
                    </p>
                  </div>

                  <Button
                    aria-label={`Remove ${item.name}`}
                    className="h-10 w-10 shrink-0"
                    onClick={() => removeItem(item.productId)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={`Decrease quantity for ${item.name}`}
                      className="h-10 w-10"
                      disabled={item.quantity <= 1}
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      aria-label={`Increase quantity for ${item.name}`}
                      className="h-10 w-10"
                      disabled={item.quantity >= item.stockQuantity}
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus />
                    </Button>
                  </div>

                  <p className="text-sm font-medium tabular-nums">
                    {formatKes(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-4 border-t border-border/80 pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-base font-semibold tabular-nums">{formatKes(subtotal)}</p>
          </div>

          <div className="grid gap-2">
            <Button asChild className="w-full min-h-11">
              <Link href="/checkout" onClick={() => setOpen(false)}>
                Proceed to checkout
              </Link>
            </Button>
            {items.length > 0 ? (
              <Button
                className="w-full min-h-11"
                onClick={() => clearCart()}
                type="button"
                variant="outline"
              >
                Clear cart
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}