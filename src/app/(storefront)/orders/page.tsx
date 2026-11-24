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

type OrdersPageProps = {
  searchParams: Promise<{
    order?: string | string[];
  }>;
};

export default async function OrdersPage(props: OrdersPageProps) {
  const searchParams = await props.searchParams;
  const rawOrder = Array.isArray(searchParams?.order)
    ? searchParams.order[0]
    : searchParams?.order;
  const initialOrderNumber =
    typeof rawOrder === "string" && rawOrder.trim().length > 0
      ? rawOrder.trim().toUpperCase()
      : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2 border-b border-border/80 pb-6">
        <p className="text-sm font-medium text-primary">Your Orders</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Orders &amp; Tracking
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Select a recent order below or enter your order number and phone
          number to check an order from another device.
        </p>
      </div>

      <div className="mt-6 sm:mt-8">
        <CustomerOrdersView initialOrderNumber={initialOrderNumber} />
      </div>
    </main>
  );
}
