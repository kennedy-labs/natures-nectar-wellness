import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/config/env.client";

export function Footer() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I would like to place an order."
  );

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">Nature&apos;s Nectar Wellness</p>
          <p>Natural wellness products, delivered across Kenya.</p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <Link className="hover:text-foreground" href="/products">
            Browse products
          </Link>
          {whatsappUrl ? (
            <a
              className="inline-flex items-center gap-1 hover:text-foreground"
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
    </footer>
  );
}
