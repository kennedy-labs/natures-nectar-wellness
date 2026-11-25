import Link from "next/link";
import { Leaf, MessageCircle } from "lucide-react";

import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import { CartButton } from "@/features/cart/components/CartButton";
import { CartDrawer } from "@/features/cart/components/CartDrawer";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/orders", label: "Track Order" },
];

export function Navbar() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I have a question about your products."
  );

  return (
    <header className="sticky top-0 z-40 h-16 max-h-16 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
        {/* Zone 1: Mobile drawer & Brand mark */}
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <MobileNavDrawer whatsappUrl={whatsappUrl} />
          <Link
            className="flex min-w-0 items-center gap-2 font-display text-base font-semibold tracking-tight text-foreground transition-colors hover:text-primary sm:text-lg whitespace-nowrap"
            href="/"
          >
            <Leaf className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Nature&apos;s Nectar</span>
          </Link>
        </div>

        {/* Zone 2: Primary navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"
        >
          {navLinks.map((link) => (
            <Link
              className="whitespace-nowrap shrink-0 transition-colors hover:text-foreground hover:underline underline-offset-4"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Actions (WhatsApp Care & Cart) */}
        <div className="flex shrink-0 items-center gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="hidden sm:inline-flex shrink-0"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-9 gap-1.5 whitespace-nowrap shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span>Care</span>
              </Button>
            </a>
          ) : null}
          <CartButton />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
