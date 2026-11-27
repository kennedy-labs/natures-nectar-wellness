import type { Metadata } from "next";

import { PolicyPageShell } from "@/components/layout/PolicyPageShell";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/config/site";
import { createTopicInquiryMessage } from "@/features/whatsapp/utils/whatsapp.utils";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms governing orders, pricing, M-Pesa payments, and wellness product use at ${SITE_NAME}.`,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: `Terms & Conditions | ${SITE_NAME}`,
    description: `Terms governing orders, pricing, payments, and product use at ${SITE_NAME}.`,
    url: "/terms",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function TermsPage() {
  return (
    <PolicyPageShell
      eyebrow="Store Policies"
      title="Terms & Conditions"
      summary="Clear terms covering product pricing, order confirmation, payments, and responsible use of our natural wellness formulations."
      lastUpdated="November 2026"
      whatsappMessage={createTopicInquiryMessage("your Terms & Conditions")}
      highlights={[
        { label: "Currency", value: "Kenyan Shillings (KES)" },
        { label: "Payment Hold", value: "Auto-expires if unpaid" },
        { label: "Governing Law", value: "Republic of Kenya" },
      ]}
      sections={[
        { id: "pricing-availability", title: "1. Pricing and availability" },
        { id: "order-acceptance", title: "2. Order acceptance and payments" },
        { id: "wellness-disclaimer", title: "3. Herbal wellness disclaimer" },
        { id: "governing-law", title: "4. Governing law" },
      ]}
    >
      <section
        id="pricing-availability"
        className="scroll-mt-24 space-y-2.5 border-b border-border/70 pb-7"
      >
        <h2 className="font-display text-xl font-medium text-foreground">
          1. Pricing and availability
        </h2>
        <p>
          All product prices on {SITE_NAME} are listed in Kenyan Shillings
          (KES). Stock availability is displayed on each product page, and we
          reserve the right to update pricing, stock quantities, or product
          listings at any time without prior notice.
        </p>
      </section>

      <section
        id="order-acceptance"
        className="scroll-mt-24 space-y-2.5 border-b border-border/70 pb-7"
      >
        <h2 className="font-display text-xl font-medium text-foreground">
          2. Order acceptance and payments
        </h2>
        <p>
          For Cash on Pickup orders, your order is recorded upon submission and
          settled in cash when collecting your items. For M-Pesa orders, stock
          is only finalized and your order confirmed once payment verification
          succeeds. Unpaid M-Pesa checkout holds expire automatically if payment
          is not completed.
        </p>
      </section>

      <section
        id="wellness-disclaimer"
        className="scroll-mt-24 space-y-2.5 border-b border-border/70 pb-7"
      >
        <h2 className="font-display text-xl font-medium text-foreground">
          3. Herbal wellness disclaimer
        </h2>
        <p>
          Our herbal teas, raw forest honey, mineral resins, tinctures, and
          natural supplements are offered for everyday wellbeing and nutritional
          support. They are not intended to diagnose, treat, cure, or prevent
          any medical condition. Please consult a qualified healthcare
          professional before use if you are pregnant, nursing, taking
          prescription medication, or managing a health condition.
        </p>
      </section>

      <section id="governing-law" className="scroll-mt-24 space-y-2.5">
        <h2 className="font-display text-xl font-medium text-foreground">
          4. Governing law
        </h2>
        <p>
          These terms and all purchases made through this storefront are
          governed by the laws of the Republic of Kenya.
        </p>
      </section>
    </PolicyPageShell>
  );
}
