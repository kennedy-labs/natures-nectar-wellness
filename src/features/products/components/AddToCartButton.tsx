"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
      clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (feedback === "added") {
      timerRef.current = setTimeout(() => {
        setFeedback("idle");
      }, 1500);
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
      // Stock or validation guard prevented adding
    }
  }

  if (isOutOfStock) {
    return (
      <Button
        type="button"
        size="sm"
        className="min-h-10 px-4"
        disabled
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className="min-h-10 px-4"
      disabled={isMaxed}
      variant={feedback === "added" ? "default" : "outline"}
      onClick={handleClick}
    >
      {feedback === "added"
        ? "✓ Added!"
        : isMaxed
          ? "Max in cart"
          : "Add to cart"}
    </Button>
  );
}