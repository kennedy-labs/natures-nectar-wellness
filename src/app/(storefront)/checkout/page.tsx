import type { Metadata } from "next";

import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import type { PaystackReturnParams } from "@/features/checkout/types/checkout.types";
import { getPaymentGatewayAvailability } from "@/server/services/payment-gateway.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

type CheckoutPageProps = {
  searchParams: Promise<{
    paystack_ref?: string;
    reference?: string;
    order_id?: string;
    order_number?: string;
  }>;
};

export default async function CheckoutPage(props: CheckoutPageProps) {
  const params = await props.searchParams;
  const gatewayAvailability = getPaymentGatewayAvailability();

  const paystackRef = params.paystack_ref || params.reference;
  const initialPaystackReturn: PaystackReturnParams | null =
    paystackRef && params.order_id && params.order_number
      ? {
          reference: paystackRef,
          orderId: params.order_id,
          orderNumber: params.order_number,
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Secure Checkout
            </p>
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Complete your order
            </h1>
          </div>

          {/* 3-Step Visual Progress Orientation */}
          <ol
            aria-label="Checkout progress"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <li className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="font-mono text-primary">01</span>
              <span>Bag &amp; Contact</span>
            </li>
            <span aria-hidden="true" className="text-border">
              —
            </span>
            <li className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="font-mono text-primary">02</span>
              <span>Delivery &amp; Pin</span>
            </li>
            <span aria-hidden="true" className="text-border">
              —
            </span>
            <li className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="font-mono text-primary">03</span>
              <span>M-Pesa / Cash</span>
            </li>
          </ol>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Review your items, choose Nairobi pickup or delivery, and select M-Pesa
          or Cash on Pickup.
        </p>
      </header>

      <div className="mt-8">
        <CheckoutForm
          gatewayAvailability={gatewayAvailability}
          initialPaystackReturn={initialPaystackReturn}
        />
      </div>
    </main>
  );
}