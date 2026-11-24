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
    const itemCount = isClient ? rawCount : 0;

    return (
      <Button
        ref={ref}
        size="sm"
        type="button"
        variant="outline"
        className={cn("h-10 px-2.5 sm:h-9 sm:px-3", className)}
        aria-label={
          itemCount > 0 ? `Open cart (${itemCount} items)` : "Open cart"
        }
        {...props}
      >
        <ShoppingBag className="h-4 w-4" />
        <span>Cart</span>

        {itemCount > 0 ? (
          <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {itemCount}
          </span>
        ) : null}
      </Button>
    );
  }
);
CartButton.displayName = "CartButton";