import type { Metadata } from "next";

import { OrderTracker } from "@/features/orders/components/OrderTracker";
import { getPaymentGatewayAvailability } from "@/server/services/payment-gateway.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Order",
  robots: {
    index: false,
    follow: false,
  },
};

type TrackOrderPageProps = {
  searchParams: Promise<{
    order?: string;
  }>;
};

export default async function TrackOrderPage(props: TrackOrderPageProps) {
  const params = await props.searchParams;
  const gatewayAvailability = getPaymentGatewayAvailability();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Order Tracking</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Track your order
        </h1>
        <p className="text-muted-foreground">
          Enter your order number and the phone number used at checkout to see
          live status updates or complete payment.
        </p>
      </div>

      <div className="mt-8">
        <OrderTracker
          gatewayAvailability={gatewayAvailability}
          initialOrderNumber={params.order?.trim() ?? ""}
        />
      </div>
    </main>
  );
}
