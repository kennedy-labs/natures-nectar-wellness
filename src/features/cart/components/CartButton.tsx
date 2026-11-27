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
        className={cn(
          "h-9 shrink-0 gap-1.5 border-border bg-card px-2.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-card sm:px-3.5 sm:text-sm",
          className
        )}
        aria-label={
          itemCount > 0 ? `Open bag (${itemCount} items)` : "Open bag"
        }
        {...props}
      >
        <ShoppingBag className="h-4 w-4 shrink-0 text-primary" />
        <span className="hidden min-[380px]:inline">Bag</span>

        {itemCount > 0 ? (
          <span className="border-l border-border pl-1.5 text-xs font-semibold text-primary tabular-nums">
            {itemCount}
          </span>
        ) : null}
      </Button>
    );
  }
);
CartButton.displayName = "CartButton";