"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
      <SheetContent className="flex w-full flex-col border-border bg-background px-5 py-6 sm:max-w-md sm:p-6">
        <SheetHeader className="border-b border-border pb-4 text-left">
          <SheetTitle className="font-display text-2xl font-medium tracking-tight">
            Your Bag
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Review quantities before continuing to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex-1 overflow-auto pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-b border-border/70 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-lg font-medium text-foreground">
                Your bag is empty
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Explore raw honey, mineral resins, and herbal teas to get started.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="mt-5 min-h-10"
              >
                <Link href="/products" onClick={() => setOpen(false)}>
                  Browse formulations
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/80">
              {items.map((item) => (
                <li className="py-4" key={item.productId}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        className="font-display text-base font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                        href={`/products/${item.slug}`}
                        onClick={() => setOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                        {formatKes(item.price)} · {item.stockQuantity} available
                      </p>
                    </div>

                    <Button
                      aria-label={`Remove ${item.name}`}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-md border border-border bg-card">
                      <Button
                        aria-label={`Decrease quantity for ${item.name}`}
                        className="h-9 w-9 rounded-none border-0 border-r border-border"
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        aria-label={`Increase quantity for ${item.name}`}
                        className="h-9 w-9 rounded-none border-0 border-l border-border"
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatKes(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 space-y-4 border-t border-border pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="font-display text-xl font-medium tabular-nums text-foreground">
              {formatKes(subtotal)}
            </p>
          </div>

          <div className="grid gap-2">
            {items.length === 0 ? (
              <>
                <Button
                  type="button"
                  disabled
                  className="min-h-11 w-full"
                >
                  Proceed to checkout
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Add at least one item to proceed to checkout.
                </p>
              </>
            ) : (
              <>
                <Button asChild className="min-h-11 w-full">
                  <Link href="/checkout" onClick={() => setOpen(false)}>
                    Proceed to checkout
                  </Link>
                </Button>
                <Button
                  className="min-h-10 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => clearCart()}
                  type="button"
                  variant="ghost"
                >
                  Clear bag
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}