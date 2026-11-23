"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrdersStore } from "@/store/orders.store";

const emptySubscribe = () => () => {};

export function OrdersNavLink() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const rawCount = useOrdersStore((state) => state.orders.length);
  const count = isClient ? rawCount : 0;

  return (
    <Button asChild size="sm" variant="ghost">
      <Link href="/orders" className="gap-1.5">
        <Package className="h-4 w-4" />
        <span>Orders</span>
        {count > 0 ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
