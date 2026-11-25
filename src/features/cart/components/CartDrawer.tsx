"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Minus, Plus, Trash2, ArrowRight, Truck } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getWhatsAppUrl } from "@/config/env.client";
import { formatKes } from "@/lib/format";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};
const FREE_DELIVERY_THRESHOLD = 5000;

export function CartDrawer() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawItems = useCartStore((state) => state.items);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());
  const isDrawerOpen = useCartStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const [deliveryLocation, setDeliveryLocation] = useState("");

  const items = isClient ? rawItems : [];
  const subtotal = isClient ? rawSubtotal : 0;
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const deliveryProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  const generateWhatsAppUrl = () => {
    if (items.length === 0) return "#";
    const lines = [
      "Hello Nature's Nectar Wellness, I would like to place an order:",
      "",
      ...items.map(
        (i) => `- ${i.quantity}x ${i.name} (${formatKes(i.price * i.quantity)})`
      ),
      "",
      `Total: ${formatKes(subtotal)}`,
      `Delivery Location: ${deliveryLocation.trim() || "Pending confirmation"}`,
      "Payment Preference: M-Pesa on confirmation",
    ];
    return getWhatsAppUrl(lines.join("\n"));
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="flex w-full flex-col bg-background px-4 py-5 sm:max-w-md sm:p-6">
        <SheetHeader className="border-b border-border/70 pb-4 text-left">
          <div className="flex items-baseline gap-2.5 pr-12">
            <SheetTitle className="font-display text-xl font-medium tracking-tight">
              Apothecary Bag
            </SheetTitle>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              ({totalCount} {totalCount === 1 ? "item" : "items"})
            </span>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Review items for instant WhatsApp or M-Pesa checkout.
          </SheetDescription>

          {items.length > 0 ? (
            <div className="mt-3 space-y-1.5 rounded-lg bg-muted/60 px-3 py-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Truck className="h-3.5 w-3.5 shrink-0 text-primary" />
                {remainingForFreeDelivery === 0 ? (
                  <span className="text-primary">
                    Unlocked free Nairobi rider delivery
                  </span>
                ) : (
                  <span>
                    Add <span className="font-semibold tabular-nums">{formatKes(remainingForFreeDelivery)}</span> more for free Nairobi delivery
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </SheetHeader>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/60 p-8 text-center">
              <p className="font-display text-base font-medium text-foreground">Your bag is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Discover our wild-harvested honey, teas, and herbal tinctures.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setDrawerOpen(false)}
                asChild
              >
                <Link href="/products">Browse Formulations</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                className="flex gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs"
                key={item.productId}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/60">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      referrerPolicy="no-referrer"
                      unoptimized={
                        item.image.startsWith("/api/media/") ||
                        item.image.startsWith("data:")
                      }
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-1 text-center font-display text-[10px] text-muted-foreground">
                      NN
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      className="truncate font-display text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
                      href={`/products/${item.slug}`}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <button
                      aria-label={`Remove ${item.name}`}
                      className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() => removeItem(item.productId)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-md border border-border bg-background">
                      <button
                        aria-label={`Decrease quantity for ${item.name}`}
                        className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        type="button"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-semibold tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        aria-label={`Increase quantity for ${item.name}`}
                        className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        type="button"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold tabular-nums text-foreground">
                      {formatKes(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="mt-auto space-y-3.5 border-t border-border/80 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-1">
              <label htmlFor="delivery-location" className="text-xs font-medium text-foreground">
                Delivery Location (Optional)
              </label>
              <input
                id="delivery-location"
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="e.g. Westlands, Nairobi or Mombasa"
                className="w-full rounded-lg border border-border/90 bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order Subtotal</span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {formatKes(subtotal)}
              </span>
            </div>

            <div className="grid gap-2">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  className="w-full min-h-11 gap-2 bg-[#168A47] font-medium text-white shadow-xs hover:bg-[#12723b]"
                  type="button"
                >
                  <MessageCircle className="h-4 w-4" />
                  Confirm Order on WhatsApp
                </Button>
              </a>

              <Button asChild variant="outline" className="w-full min-h-11 gap-1.5">
                <Link href="/checkout" onClick={() => setDrawerOpen(false)}>
                  <span>Checkout Online (M-Pesa / Card)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <button
                className="py-1 text-center text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                onClick={() => clearCart()}
                type="button"
              >
                Clear all items
              </button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}