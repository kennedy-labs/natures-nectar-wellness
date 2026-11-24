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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2 border-b border-border/80 pb-6">
        <p className="text-sm font-medium text-primary">Checkout</p>

        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Complete your order
        </h1>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Review your items, delivery details, and payment preference before
          submitting your order.
        </p>
      </div>

      <div className="mt-6 sm:mt-8">
        <CheckoutForm
          gatewayAvailability={gatewayAvailability}
          initialPaystackReturn={initialPaystackReturn}
        />
      </div>
    </main>
  );
}