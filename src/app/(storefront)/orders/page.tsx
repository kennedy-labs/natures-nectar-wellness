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
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Storefront</p>
        <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Select an order below to inspect your ordered items and live fulfillment
          status.
        </p>
      </div>

      <div className="mt-8">
        <CustomerOrdersView />
      </div>
    </main>
  );
}
