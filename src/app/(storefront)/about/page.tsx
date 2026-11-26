import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  BUSINESS_LOCATION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  getAbsoluteUrl,
} from "@/config/site";
import { DEFAULT_STOREFRONT_WHATSAPP_MESSAGE } from "@/features/whatsapp/utils/whatsapp.utils";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${SITE_NAME}, our Kenyan botanical sourcing standards, small-batch quality approach, M-Pesa checkout, and countrywide delivery.`,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description:
      "Kenyan botanical sourcing standards, small-batch natural formulations, and personal WhatsApp & M-Pesa care across Kenya.",
    url: "/about",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About Us | ${SITE_NAME}`,
    description:
      "Kenyan botanical sourcing standards, small-batch natural formulations, and personal WhatsApp & M-Pesa care across Kenya.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function AboutPage() {
  const whatsappUrl = getWhatsAppUrl(DEFAULT_STOREFRONT_WHATSAPP_MESSAGE);

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: getAbsoluteUrl("/about"),
    description:
      "Kenyan botanical apothecary offering small-batch herbal teas, raw forest honey, mineral resins, and natural wellness supplements.",
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
        name: "About Us",
        item: getAbsoluteUrl("/about"),
      },
    ],
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([aboutSchema, breadcrumbSchema]),
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
        <span className="font-medium text-foreground">About Us</span>
      </nav>

      <header className="space-y-4 border-b border-border/80 pb-8">
        <p className="text-sm font-medium text-primary">Our Story &amp; Craft</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-[2.6rem] md:leading-[1.15] text-balance">
          Botanical simplicity crafted for everyday Kenyan wellness
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
          {SITE_NAME} brings together small-batch herbal teas, raw forest
          honey, pure mineral resins, and natural supplements selected with
          honesty, clean labeling, and attentive customer support.
        </p>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section className="space-y-2 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)]">
          <p className="text-xs font-medium text-primary">01. Ingredient Clarity</p>
          <h2 className="font-display text-xl font-medium text-foreground">
            Pure botanical focus
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every product page clearly lists ingredients, preparation guidance,
            and practical everyday uses without inflated claims or cluttered
            marketing jargon.
          </p>
        </section>

        <section className="space-y-2 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)]">
          <p className="text-xs font-medium text-primary">02. Personal Guidance</p>
          <h2 className="font-display text-xl font-medium text-foreground">
            Direct WhatsApp care
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Whether you are comparing herbal teas, asking how to prepare resin,
            or checking stock before ordering, our team responds directly on
            WhatsApp.
          </p>
        </section>

        <section className="space-y-2 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)]">
          <p className="text-xs font-medium text-primary">03. Kenya-Wide Reach</p>
          <h2 className="font-display text-xl font-medium text-foreground">
            Seamless M-Pesa &amp; delivery
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pay easily via instant M-Pesa STK Push or Cash on Pickup, enjoy free
            Nairobi delivery and pickup, or coordinate transparent countrywide
            courier dispatch.
          </p>
        </section>
      </div>

      <section className="mt-10 space-y-4 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-8">
        <h2 className="font-display text-2xl font-medium text-foreground">
          How we approach quality and transparency
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          <p>
            Wellness routines work best when you know exactly what is in your
            cup or jar. Rather than burying details in fine print, we highlight
            straightforward botanical sourcing, traditional uses, and clear
            stock availability across every item in our store.
          </p>
          <p>
            Our herbal teas, raw honey, mineral resins, and supplements are
            offered as natural everyday foods and botanical wellness products
            and are not intended to diagnose, treat, cure, or replace licensed
            medical care.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link href="/products">
              Browse formulations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link href="/faq">Read customer FAQ</Link>
          </Button>
          {whatsappUrl ? (
            <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                <MessageCircle className="h-4 w-4 text-primary" />
                Chat on WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
      </section>

      <section
        id="visit-us"
        className="mt-10 grid gap-6 rounded-xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-8 lg:grid-cols-12 lg:items-center"
      >
        <div className="space-y-4 lg:col-span-5">
          <p className="text-xs font-medium text-primary">Visit Our Nairobi Shop</p>
          <h2 className="font-display text-2xl font-medium text-foreground">
            Pickup &amp; in-person assistance
          </h2>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">{BUSINESS_LOCATION.fullAddress}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a
                href={BUSINESS_LOCATION.phoneHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {BUSINESS_LOCATION.phoneDisplay}
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap">
            <Button asChild className="min-h-11 w-full sm:w-auto">
              <a
                href={BUSINESS_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/40 lg:col-span-7">
          <iframe
            title="Nature's Nectar Wellness location at Kooni Mall, Tsavo Street, Nairobi"
            src={BUSINESS_LOCATION.googleMapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-64 w-full border-0 sm:h-72"
          />
        </div>
      </section>
    </article>
  );
}
