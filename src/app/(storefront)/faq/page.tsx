import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/config/site";
import { createTopicInquiryMessage } from "@/features/whatsapp/utils/whatsapp.utils";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: `Answers to common questions about M-Pesa STK Push payments, Nairobi & countrywide delivery, WhatsApp guidance, order tracking, and sealed returns at ${SITE_NAME}.`,
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: `Frequently Asked Questions | ${SITE_NAME}`,
    description:
      "M-Pesa checkout, Kenya delivery zones, WhatsApp support, and sealed consumable returns answered clearly.",
    url: "/faq",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Frequently Asked Questions | ${SITE_NAME}`,
    description:
      "M-Pesa checkout, Kenya delivery zones, WhatsApp support, and sealed consumable returns answered clearly.",
    images: [DEFAULT_OG_IMAGE],
  },
};

const FAQ_ITEMS = [
  {
    question: "How do I pay for my order using M-Pesa?",
    answer:
      "At checkout, choose M-Pesa and enter your Safaricom phone number. You will receive an instant M-Pesa STK prompt on your handset to authorize payment with your PIN, and your order updates automatically once confirmed.",
  },
  {
    question: "What are your delivery zones and fees across Kenya?",
    answer:
      "We offer three straightforward options: Pickup (Free) once readiness is confirmed, Within Nairobi (Free) once your drop-off location is coordinated, and Outside Nairobi (Admin confirms fee) where our team confirms the exact countrywide courier rate with you before dispatch.",
  },
  {
    question: "How can I track my order after checkout?",
    answer:
      "Visit the Track Orders page from the top menu anytime and enter your order number together with the phone number or email used at checkout to see live payment and delivery status across any device.",
  },
  {
    question: "Can I ask questions about an herb or blend before ordering?",
    answer:
      "Yes. Every product page, the floating WhatsApp button, and the store footer let you message our team directly for preparation tips, availability checks, or delivery coordination.",
  },
  {
    question: "What is your return and refund policy?",
    answer:
      "Please inspect your items upon collection or delivery. Because our catalog includes consumable teas, raw honey, and herbal extracts, opened or unsealed items cannot be returned for hygiene reasons unless damaged or incorrect. If an item arrives damaged or missing, message us on WhatsApp within 48 hours with a clear photo and your order number; approved refunds on paid M-Pesa orders are processed within 3 to 5 business days.",
  },
  {
    question: "Are your herbal formulations medical treatments?",
    answer:
      "No. Our herbal teas, mineral resins, raw honey, and botanical supplements are natural wellness foods and traditional preparations for everyday balance, and are not intended to diagnose, treat, cure, or replace guidance from a qualified healthcare professional.",
  },
] as const;

export default function FaqPage() {
  const faqWhatsappMessage = createTopicInquiryMessage("your FAQ");
  const whatsappUrl = getWhatsAppUrl(faqWhatsappMessage);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: getAbsoluteUrl("/faq"),
      },
    ],
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <WhatsAppPageContext message={faqWhatsappMessage} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([faqSchema, breadcrumbSchema]),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">FAQ</span>
      </nav>

      <header className="space-y-3 border-b border-border/80 pb-6">
        <p className="text-sm font-medium text-primary">Customer Help</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Clear answers on M-Pesa checkout, Nairobi and countrywide delivery,
          cross-device order tracking, and botanical care.
        </p>
      </header>

      <div className="mt-8 space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <section
            key={item.question}
            className="rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)]"
          >
            <p className="text-xs font-medium text-primary">
              0{index + 1}
            </p>
            <h2 className="mt-1 font-display text-xl font-medium text-foreground">
              {item.question}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {item.answer}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-10 flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-medium text-foreground">
            Need help with a specific product or delivery?
          </h2>
          <p className="text-sm text-muted-foreground">
            Message us on WhatsApp or review our full delivery and refund policy.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          {whatsappUrl ? (
            <Button asChild className="min-h-10 w-full sm:w-auto">
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="min-h-10 w-full sm:w-auto">
            <Link href="/delivery-refund-policy">
              Delivery policy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </article>
  );
}
