import type { Metadata } from "next";

import { CustomerOrdersView } from "@/features/orders/components/CustomerOrdersView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2 border-b border-border/80 pb-6">
        <p className="text-sm font-medium text-primary">Your Account</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Orders
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Select an order below to inspect your ordered items and live fulfillment
          status.
        </p>
      </div>

      <div className="mt-6 sm:mt-8">
        <CustomerOrdersView />
      </div>
    </main>
  );
}
