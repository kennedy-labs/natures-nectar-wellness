"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";

type CheckoutSuccessProps = {
  orderNumber: string;
  whatsappMessage: string;
};

export function CheckoutSuccess({
  orderNumber,
  whatsappMessage,
}: CheckoutSuccessProps) {
  const whatsappUrl =
    getWhatsAppUrl(whatsappMessage) ??
    `https://wa.me/254757122299?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto max-w-md space-y-4">
        <p className="text-sm font-medium text-green-600">
          Order submitted successfully
        </p>

        <h2 className="text-3xl font-semibold tracking-tight">
          Thank you for your order
        </h2>

        <p className="text-muted-foreground">
          Your order has been received and is awaiting confirmation.
        </p>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            Order number
          </p>

          <p className="mt-1 text-lg font-semibold">
            {orderNumber}
          </p>
        </div>

        <Button asChild className="w-full">
          <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
            Continue on WhatsApp
          </a>
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <Link href="/products">
            Continue shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
