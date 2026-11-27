import Link from "next/link";
import { ArrowUpRight, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";

import { getWhatsAppUrl } from "@/config/env.client";
import { BUSINESS_LOCATION } from "@/config/site";
import { DEFAULT_STOREFRONT_WHATSAPP_MESSAGE } from "@/features/whatsapp/utils/whatsapp.utils";

export function Footer() {
  const whatsappUrl = getWhatsAppUrl(DEFAULT_STOREFRONT_WHATSAPP_MESSAGE);

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="space-y-4 md:col-span-5">
            <p className="font-display text-xl font-medium tracking-tight text-foreground">
              Nature&apos;s Nectar Wellness
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Small-batch herbal teas, raw forest honey, mineral resins, and
              botanical formulations delivered across Kenya.
            </p>
            <div className="space-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{BUSINESS_LOCATION.fullAddress}</span>
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-5.5">
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
                  className="inline-flex items-center gap-1 font-medium text-foreground tabular-nums underline-offset-4 hover:underline"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  {BUSINESS_LOCATION.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-7">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Shop
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/products">
                    All Formulations
                  </Link>
                </li>
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/categories">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/orders">
                    Orders &amp; Tracking
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apothecary
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/about">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/faq">
                    Customer FAQ
                  </Link>
                </li>
                {whatsappUrl ? (
                  <li>
                    <a
                      className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:underline"
                      href={whatsappUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp Care
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="col-span-2 space-y-3 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Policies
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link
                    className="transition-colors hover:text-foreground"
                    href="/delivery-refund-policy"
                  >
                    Delivery &amp; Refunds
                  </Link>
                </li>
                <li>
                  <Link
                    className="transition-colors hover:text-foreground"
                    href="/privacy-policy"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="transition-colors hover:text-foreground" href="/terms">
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Nature&apos;s Nectar Wellness. All rights reserved.
          </p>
          <p className="tabular-nums">
            Nairobi Flagship · M-Pesa &amp; Cash on Pickup · Countrywide Dispatch
          </p>
        </div>
      </div>
    </footer>
  );
}
