import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";

export default function CheckoutPage() {
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
        <CheckoutForm />
      </div>
    </main>
  );
}