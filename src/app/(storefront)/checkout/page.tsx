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
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Checkout</p>

        <h1 className="text-3xl font-semibold tracking-tight">
          Complete your order
        </h1>

        <p className="text-muted-foreground">
          Review your items, delivery details, and payment preference before
          submitting your order.
        </p>
      </div>

      <div className="mt-8">
        <CheckoutForm
          gatewayAvailability={gatewayAvailability}
          initialPaystackReturn={initialPaystackReturn}
        />
      </div>
    </main>
  );
}