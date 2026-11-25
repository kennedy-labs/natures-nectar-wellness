"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};

export function FloatingCartButton() {
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawCount = useCartStore((state) => state.getItemCount());
  const openDrawer = useCartStore((state) => state.openDrawer);
  const itemCount = isClient ? rawCount : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={itemCount > 0 ? `Open shopping bag with ${itemCount} items` : "Open shopping bag"}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(26,66,45,0.32)] transition-all duration-200 hover:scale-105 hover:bg-primary/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6"
    >
      <ShoppingBag className="h-6 w-6 shrink-0" />
      {itemCount > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold leading-none text-slate-950 shadow-sm tabular-nums">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
