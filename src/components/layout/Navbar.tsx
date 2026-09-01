import Link from "next/link";
import { Leaf, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import { CartDrawer } from "@/features/cart/components/CartDrawer";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
];

export function Navbar() {
  const whatsappUrl = getWhatsAppUrl(
    "Hello Nature's Nectar Wellness, I have a question about your products."
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link className="flex items-center gap-2 font-semibold tracking-tight" href="/">
          <Leaf className="h-5 w-5 text-primary" />
          <span>Nature&apos;s Nectar</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
        <CartDrawer />
          {whatsappUrl ? (
  <a
    href={whatsappUrl}
    rel="noopener noreferrer"
    target="_blank"
  >
    <Button size="sm" variant="outline">
      <MessageCircle />
      WhatsApp
    </Button>
  </a>
) : null}
        </div>
      </div>
    </header>
  );
}
