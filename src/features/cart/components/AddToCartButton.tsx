"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";

const emptySubscribe = () => () => {};

type AddToCartButtonProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stockQuantity: number;
    image: string | null;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const addItem = useCartStore((state) => state.addItem);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const rawItemInCart = useCartStore((state) =>
    state.items.find((item) => item.productId === product.id)
  );
  const itemInCart = isClient ? rawItemInCart : undefined;

  const [selectedQty, setSelectedQty] = useState(1);
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const remainingStock = useMemo(() => {
    const inCart = itemInCart?.quantity ?? 0;
    return Math.max(0, product.stockQuantity - inCart);
  }, [itemInCart?.quantity, product.stockQuantity]);

  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxed = !isOutOfStock && remainingStock <= 0;
  const effectiveQty = Math.min(selectedQty, Math.max(1, remainingStock));

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (feedback === "added") {
      timerRef.current = setTimeout(() => {
        setFeedback("idle");
      }, 1200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [feedback]);

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <div className="flex flex-wrap items-center gap-2.5">
        {!isOutOfStock && !isMaxed ? (
          <div
            aria-label="Quantity selector"
            className="flex h-11 items-center rounded-lg border border-border bg-card"
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={effectiveQty <= 1}
              onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
              className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums text-foreground">
              {effectiveQty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={effectiveQty >= remainingStock}
              onClick={() =>
                setSelectedQty((q) => Math.min(remainingStock, q + 1))
              }
              className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <Button
          className={
            feedback === "added"
              ? "min-h-11 flex-1 gap-2 bg-emerald-700 text-white hover:bg-emerald-700 sm:flex-initial"
              : "min-h-11 flex-1 gap-2 sm:flex-initial"
          }
          disabled={isOutOfStock || isMaxed}
          onClick={() => {
            setError(null);
            try {
              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                stockQuantity: product.stockQuantity,
                image: product.image,
                quantity: effectiveQty,
              });
              setSelectedQty(1);
              setFeedback("added");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not add to cart."
              );
            }
          }}
          type="button"
        >
          {feedback === "added" ? (
            <>
              <Check className="h-4 w-4 stroke-[2.5]" />
              Added ✓
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock
                ? "Out of stock"
                : isMaxed
                  ? "Max in cart"
                  : "Add to cart"}
            </>
          )}
        </Button>

        {itemInCart && itemInCart.quantity > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openDrawer}
            className="min-h-11 text-xs font-medium text-primary underline underline-offset-4 hover:bg-transparent"
          >
            View bag ({itemInCart.quantity})
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
