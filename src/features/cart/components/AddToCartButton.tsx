"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ShoppingCart } from "lucide-react";

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
  const rawItemInCart = useCartStore((state) =>
    state.items.find((item) => item.productId === product.id)
  );
  const itemInCart = isClient ? rawItemInCart : undefined;

  const [error, setError] = useState<string | null>(null);

  const remainingStock = useMemo(() => {
    const inCart = itemInCart?.quantity ?? 0;
    return Math.max(0, product.stockQuantity - inCart);
  }, [itemInCart?.quantity, product.stockQuantity]);

  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxed = remainingStock <= 0;

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <Button
        className="w-full min-h-11 sm:w-auto"
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
              quantity: 1,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not add to cart.");
          }
        }}
        type="button"
      >
        <ShoppingCart />
        {isOutOfStock ? "Out of stock" : isMaxed ? "Max in cart" : "Add to cart"}
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

