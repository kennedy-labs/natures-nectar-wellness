import type { Metadata } from "next";

import { PolicyPageShell } from "@/components/layout/PolicyPageShell";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects your order and contact information in Kenya.`,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `How ${SITE_NAME} handles your order and contact details.`,
    url: "/privacy-policy",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageShell
      eyebrow="Store Policies"
      title="Privacy Policy"
      summary="We respect your privacy and only collect the information needed to fulfill your orders, process M-Pesa payments, and coordinate delivery."
      lastUpdated="November 2026"
      whatsappMessage="Hello Nature's Nectar Wellness, I have a question about your Privacy Policy."
    >
      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          1. Information we collect
        </h2>
        <p>
          When you place an order, we collect your full name, phone number,
          optional email address, selected delivery method, and any delivery
          location details or notes you provide. If you choose to share your GPS
          pin at checkout, those coordinates are stored solely to help deliver
          your order accurately.
        </p>
        <p>
          Your shopping cart items and recent order references are saved locally
          in your browser so you can resume shopping and view your order status
          when returning to the storefront.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          2. How we use your information
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To confirm and prepare your herbal wellness orders.</li>
          <li>
            To initiate and verify M-Pesa payment requests when you choose
            M-Pesa checkout.
          </li>
          <li>
            To coordinate pickup timing, delivery fees, and courier dispatch via
            phone or WhatsApp.
          </li>
          <li>To respond to customer care questions and support requests.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          3. Sharing and payment security
        </h2>
        <p>
          We do not sell, rent, or trade your personal information. Order and
          delivery details are shared only with trusted service providers
          strictly required to complete your transaction—such as Safaricom
          M-Pesa payment processing or the courier handling your delivery.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-medium text-foreground">
          4. Your rights under Kenyan law
        </h2>
        <p>
          In line with the Kenya Data Protection Act, you may request access to,
          correction of, or deletion of your personal contact details held with
          us (except where retention is required for tax or accounting records)
          by messaging our support line on WhatsApp.
        </p>
      </section>
    </PolicyPageShell>
  );
}
