import Link from "next/link";
import { Leaf } from "lucide-react";

import { HeaderSearchTrigger } from "@/components/layout/HeaderSearchTrigger";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { getWhatsAppUrl } from "@/config/env.client";
import { CartDrawer } from "@/features/cart/components/CartDrawer";
import { OrdersNavLink } from "@/features/orders/components/OrdersNavLink";
import { DEFAULT_STOREFRONT_WHATSAPP_MESSAGE } from "@/features/whatsapp/utils/whatsapp.utils";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const whatsappUrl = getWhatsAppUrl(DEFAULT_STOREFRONT_WHATSAPP_MESSAGE);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-6 sm:px-6">
        {/* Zone 1: Brand Wordmark + Mobile Menu */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:flex-initial">
          <MobileNavDrawer whatsappUrl={whatsappUrl} />
          <Link
            className="flex min-w-0 max-w-full items-center gap-2 font-display text-[16px] font-medium tracking-tight text-foreground transition-colors hover:text-primary sm:text-[19px]"
            href="/"
          >
            <Leaf className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">Nature&apos;s Nectar</span>
          </Link>
        </div>

        {/* Zone 2: Primary Storefront Links (4 concise items) */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm font-medium md:flex lg:gap-8"
        >
          {navLinks.map((link) => (
            <Link
              className="whitespace-nowrap shrink-0 text-muted-foreground underline-offset-[6px] transition-colors hover:text-foreground hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Search Trigger, Orders & Bag Drawer */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <HeaderSearchTrigger />
          <OrdersNavLink />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
