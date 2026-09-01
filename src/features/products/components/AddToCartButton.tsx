"use client";

import { useEffect, useRef, useState } from "react";

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

export function AddToCartButton({ product }: Props) {
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const addItem = useCartStore((state) => state.addItem);

  const disabled = product.stockQuantity <= 0;

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
  }

  if (disabled) {
    return (
      <Button type="button" size="sm" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={feedback === "added" ? "default" : "outline"}
      onClick={handleClick}
    >
      {feedback === "added" ? "✓ Added!" : "Add to cart"}
    </Button>
  );
}