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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Post-Purchase Tracking
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Orders &amp; Tracking
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Inspect live fulfillment milestones, payment confirmation, or pull up
          an order placed from another device.
        </p>
      </header>

      <div className="mt-8">
        <CustomerOrdersView initialOrderNumber={initialOrderNumber} />
      </div>
    </main>
  );
}
