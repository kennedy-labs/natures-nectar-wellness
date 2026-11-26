import Link from "next/link";
import { ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";

import { getWhatsAppUrl } from "@/config/env.client";
import { BUSINESS_LOCATION } from "@/config/site";
import { DEFAULT_STOREFRONT_WHATSAPP_MESSAGE } from "@/features/whatsapp/utils/whatsapp.utils";

export function Footer() {
  const whatsappUrl = getWhatsAppUrl(DEFAULT_STOREFRONT_WHATSAPP_MESSAGE);

  return (
    <footer className="border-t border-border/80 bg-muted/45">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <div className="flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-2.5">
            <p className="font-display text-lg font-medium text-foreground">
              Nature&apos;s Nectar Wellness
            </p>
            <p className="leading-relaxed">
              Small-batch herbal teas, raw honey, mineral resins, and botanical
              formulations delivered across Kenya.
            </p>
            <div className="space-y-1 pt-1 text-xs text-muted-foreground">
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{BUSINESS_LOCATION.fullAddress}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-5">
                <a
                  href={BUSINESS_LOCATION.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Directions
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={BUSINESS_LOCATION.phoneHref}
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  {BUSINESS_LOCATION.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm md:justify-end">
            <Link
              className="inline-flex min-h-10 items-center py-1 transition-colors hover:text-foreground"
              href="/products"
            >
              Products
            </Link>
            <Link
              className="inline-flex min-h-10 items-center py-1 transition-colors hover:text-foreground"
              href="/categories"
            >
              Categories
            </Link>
            <Link
              className="inline-flex min-h-10 items-center py-1 transition-colors hover:text-foreground"
              href="/about"
            >
              About Us
            </Link>
            <Link
              className="inline-flex min-h-10 items-center py-1 transition-colors hover:text-foreground"
              href="/faq"
            >
              FAQ
            </Link>
            <Link
              className="inline-flex min-h-10 items-center py-1 transition-colors hover:text-foreground"
              href="/orders"
            >
              Orders
            </Link>
            {whatsappUrl ? (
              <a
                className="inline-flex min-h-10 items-center gap-1.5 py-1 text-primary transition-colors hover:text-primary/80"
                href={whatsappUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Nature&apos;s Nectar Wellness. All
            rights reserved.
          </p>

          <nav
            aria-label="Legal and store policies"
            className="flex flex-wrap gap-x-5 gap-y-1"
          >
            <Link
              className="inline-flex min-h-9 items-center py-1 transition-colors hover:text-foreground"
              href="/privacy-policy"
            >
              Privacy Policy
            </Link>
            <Link
              className="inline-flex min-h-9 items-center py-1 transition-colors hover:text-foreground"
              href="/terms"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              className="inline-flex min-h-9 items-center py-1 transition-colors hover:text-foreground"
              href="/delivery-refund-policy"
            >
              Delivery &amp; Refunds
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
