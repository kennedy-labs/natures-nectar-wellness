import type { Metadata } from "next";

import { PolicyPageShell } from "@/components/layout/PolicyPageShell";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: "Delivery & Refund Policy",
  description: `Pickup, local and countrywide delivery across Kenya, order cancellations, and refund guidelines for ${SITE_NAME}.`,
  alternates: {
    canonical: "/delivery-refund-policy",
  },
  openGraph: {
    title: `Delivery & Refund Policy | ${SITE_NAME}`,
    description: `Delivery options across Kenya, order inspection, and refund guidelines for ${SITE_NAME}.`,
    url: "/delivery-refund-policy",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function DeliveryRefundPolicyPage() {
  return (
    <PolicyPageShell
      eyebrow="Store Policies"
      title="Delivery & Refund Policy"
      summary="How pickup, local delivery, countrywide shipping across Kenya, order cancellations, and eligible refunds work."
      lastUpdated="November 2026"
      whatsappMessage="Hello Nature's Nectar Wellness, I have a question about Delivery or Refunds."
    >
      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          1. Delivery zones and fees
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="font-medium text-foreground">
              Pickup (Free):
            </strong>{" "}
            Collect your order directly once we confirm readiness and pickup
            timing with you.
          </li>
          <li>
            <strong className="font-medium text-foreground">
              Within Nairobi (Free):
            </strong>{" "}
            Free delivery within Nairobi once your order and drop-off location
            are confirmed.
          </li>
          <li>
            <strong className="font-medium text-foreground">
              Outside Nairobi (Admin confirms fee):
            </strong>{" "}
            Our team confirms the courier fee with you after checkout before
            dispatch.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          2. Inspection and eligible returns
        </h2>
        <p>
          Please inspect your items on collection or delivery. Because our
          products include consumable foods, teas, honey, and herbal extracts,
          opened or unsealed items cannot be returned for hygiene and safety
          reasons unless the product arrived damaged, defective, or incorrect.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          3. Damaged, incorrect, or missing items
        </h2>
        <p>
          If an order arrives damaged, leaking, or missing an item, message us
          on WhatsApp within 48 hours of delivery with your order number and a
          clear photo. We will arrange a prompt replacement or refund.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          4. Cancellations and refund timing
        </h2>
        <p>
          Orders may be cancelled before they are dispatched for delivery.
          Approved refunds for paid M-Pesa orders are sent back via M-Pesa
          within 3 to 5 business days after confirmation.
        </p>
      </section>
    </PolicyPageShell>
  );
}
