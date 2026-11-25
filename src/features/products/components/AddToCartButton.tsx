"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    stockQuantity: number;
    image?: string | null;
  };
};

const emptySubscribe = () => () => {};

export function AddToCartButton({ product }: Props) {
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const addItem = useCartStore((state) => state.addItem);
  const rawInCartQty = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === product.id)?.quantity ?? 0
  );
  const inCartQty = isClient ? rawInCartQty : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxed = !isOutOfStock && inCartQty >= product.stockQuantity;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (feedback === "added") {
      timerRef.current = setTimeout(() => {
        setFeedback("idle");
      }, 900); // Exact 900ms feedback duration
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [feedback]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || isMaxed) return;

    try {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        stockQuantity: product.stockQuantity,
        image: product.image ?? null,
        quantity: 1,
      });
      setFeedback("added");
    } catch {
      // Guard prevented adding
    }
  }

  if (isOutOfStock) {
    return (
      <Button
        type="button"
        size="sm"
        className="h-8 px-2.5 text-xs text-muted-foreground bg-muted hover:bg-muted cursor-not-allowed opacity-60"
        disabled
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Sold out
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isMaxed}
      variant={feedback === "added" ? "default" : "default"}
      onClick={handleClick}
      className={`h-8 px-3 text-xs font-medium transition-all duration-150 ${
        feedback === "added"
          ? "bg-emerald-700 text-white hover:bg-emerald-700 shadow-xs"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {feedback === "added" ? (
        <span className="inline-flex items-center gap-1 font-semibold">
          <Check className="h-3 w-3 stroke-[3]" />
          Added ✓
        </span>
      ) : isMaxed ? (
        "Max in bag"
      ) : (
        <span className="inline-flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Add
        </span>
      )}
    </Button>
  );
}