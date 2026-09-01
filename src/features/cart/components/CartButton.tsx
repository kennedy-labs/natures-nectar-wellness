"use client";

import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";

type CartButtonProps = {
  onClick?: () => void;
};

export function CartButton({ onClick }: CartButtonProps) {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <Button onClick={onClick} size="sm" type="button" variant="outline">
      <ShoppingBag />
      Cart

      {itemCount > 0 ? (
        <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {itemCount}
        </span>
      ) : null}
    </Button>
  );
}