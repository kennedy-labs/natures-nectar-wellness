"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};

export const CartButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const isClient = React.useSyncExternalStore(
      emptySubscribe,
      () => true,
      () => false
    );
    const rawCount = useCartStore((state) => state.getItemCount());
    const openDrawer = useCartStore((state) => state.openDrawer);
    const itemCount = isClient ? rawCount : 0;

    return (
      <Button
        ref={ref}
        size="sm"
        type="button"
        variant="outline"
        onClick={openDrawer}
        className={cn(
          "h-10 shrink-0 gap-1 px-2.5 text-xs sm:h-9 sm:gap-1.5 sm:px-3 sm:text-sm",
          className
        )}
        aria-label={
          itemCount > 0 ? `Open cart (${itemCount} items)` : "Open cart"
        }
        {...props}
      >
        <ShoppingBag className="h-4 w-4 shrink-0" />
        <span className="hidden min-[420px]:inline">Cart</span>

        {itemCount > 0 ? (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground tabular-nums">
            {itemCount}
          </span>
        ) : null}
      </Button>
    );
  }
);
CartButton.displayName = "CartButton";