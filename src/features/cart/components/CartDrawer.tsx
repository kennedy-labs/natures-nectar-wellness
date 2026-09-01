"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatKes } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  function handleProceedToCheckout() {
    setOpen(false);
    router.push("/checkout");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Cart
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            Review items before checkout. Delivery fee is confirmed on WhatsApp.
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
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKes(item.price)} · Stock: {item.stockQuantity}
                    </p>
                  </div>

                  <Button
                    aria-label={`Remove ${item.name}`}
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
                      disabled={item.quantity <= 1}
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      aria-label={`Increase quantity for ${item.name}`}
                      disabled={item.quantity >= item.stockQuantity}
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus />
                    </Button>
                  </div>

                  <p className="text-sm font-medium">
                    {formatKes(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Subtotal</p>
            <p className="text-base font-semibold">{formatKes(subtotal)}</p>
          </div>

          <div className="grid gap-2">
            <Button className="w-full" onClick={handleProceedToCheckout}>
              Proceed to checkout
            </Button>
            {items.length > 0 ? (
              <Button
                className="w-full"
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