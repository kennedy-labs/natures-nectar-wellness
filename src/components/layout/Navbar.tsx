import Link from "next/link";
import { Leaf, MessageCircle } from "lucide-react";

import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { OrdersNavLink } from "@/features/orders/components/OrdersNavLink";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
];

export function Navbar() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I have a question about your products."
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-2.5 sm:h-16 sm:gap-6 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden sm:gap-2 md:flex-initial">
          <MobileNavDrawer whatsappUrl={whatsappUrl} />
          <Link
            className="flex min-w-0 max-w-full items-center gap-1.5 font-display text-[15px] font-medium tracking-tight text-foreground transition-colors hover:text-primary sm:gap-2 sm:text-lg"
            href="/"
          >
            <Leaf className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Nature&apos;s Nectar</span>
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm font-medium md:flex"
        >
          {navLinks.map((link) => (
            <Link
              className="whitespace-nowrap shrink-0 text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <OrdersNavLink />
          <CartDrawer />
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="hidden sm:inline-flex"
            >
              <Button size="sm" variant="outline" className="min-h-9">
                <MessageCircle className="text-primary" />
                WhatsApp
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
