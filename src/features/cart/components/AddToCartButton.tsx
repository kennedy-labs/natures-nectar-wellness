"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  compact?: boolean;
};

export function AddToCartButton({ product, compact = false }: AddToCartButtonProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const addItem = useCartStore((state) => state.addItem);
  const rawItemInCart = useCartStore((state) =>
    state.items.find((item) => item.productId === product.id)
  );
  const itemInCart = isClient ? rawItemInCart : undefined;

  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const remainingStock = useMemo(() => {
    const inCart = itemInCart?.quantity ?? 0;
    return Math.max(0, product.stockQuantity - inCart);
  }, [itemInCart?.quantity, product.stockQuantity]);

  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxed = remainingStock <= 0;
  const safeQuantity = Math.min(quantity, Math.max(1, remainingStock));

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleAdd() {
    setError(null);
    if (isOutOfStock || isMaxed) return;

    try {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        image: product.image,
        quantity: compact ? 1 : safeQuantity,
      });
      setQuantity(1);
      setFeedback("added");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFeedback("idle"), 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to bag.");
    }
  }

  if (compact) {
    return (
      <Button
        className="h-10 shrink-0 gap-1.5 px-4"
        disabled={isOutOfStock || isMaxed}
        onClick={handleAdd}
        type="button"
      >
        {feedback === "added" ? (
          <>
            <Check className="h-4 w-4" />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            <span>{isOutOfStock ? "Out of stock" : isMaxed ? "Max in bag" : "Add to Bag"}</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {!isOutOfStock && !isMaxed ? (
          <div className="inline-flex h-11 items-center justify-between rounded-md border border-border bg-background sm:w-auto">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={safeQuantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="inline-flex h-full w-11 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-sm font-medium tabular-nums">
              {safeQuantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={safeQuantity >= remainingStock}
              onClick={() =>
                setQuantity((q) => Math.min(remainingStock, q + 1))
              }
              className="inline-flex h-full w-11 items-center justify-center border-l border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <Button
          className={cn(
            "min-h-11 flex-1 gap-2 transition-colors",
            feedback === "added" && "bg-primary/90"
          )}
          disabled={isOutOfStock || isMaxed}
          onClick={handleAdd}
          type="button"
        >
          {feedback === "added" ? (
            <>
              <Check className="h-4 w-4" />
              <span>Added to Bag</span>
            </>
          ) : isOutOfStock ? (
            <span>Out of stock</span>
          ) : isMaxed ? (
            <span>Maximum available in bag</span>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              <span>
                Add to Bag · {formatKes(product.price * safeQuantity)}
              </span>
            </>
          )}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
