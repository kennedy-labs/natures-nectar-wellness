import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/config/env.client";

export function Footer() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I would like to place an order."
  );

  return (
    <footer className="border-t border-border/80 bg-muted/45">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        <div className="flex flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="font-display text-lg font-medium text-foreground">
              Nature&apos;s Nectar Wellness
            </p>
            <p className="leading-relaxed">
              Small-batch herbal teas, raw honey, mineral resins, and botanical
              formulations delivered across Kenya.
            </p>
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

        <div className="mt-8 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nature&apos;s Nectar Wellness. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
