"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { formatKes } from "@/lib/format";

type ProductMobilePurchaseBarProps = {
  targetElementId: string;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stockQuantity: number;
    image: string | null;
  };
};

export function ProductMobilePurchaseBar({
  targetElementId,
  product,
}: ProductMobilePurchaseBarProps) {
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = document.getElementById(targetElementId);
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetElementId]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur-md pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{product.name}</p>
              <p className="text-base font-semibold tabular-nums text-foreground">
                {formatKes(product.price)}
              </p>
            </div>

            <AddToCartButton compact product={product} />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
