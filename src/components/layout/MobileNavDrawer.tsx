"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Grid2x2,
  HelpCircle,
  Home,
  Info,
  Leaf,
  Menu,
  MessageCircle,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavDrawerProps = {
  whatsappUrl: string | null;
};

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: ShoppingBag },
  { href: "/categories", label: "Categories", icon: Grid2x2 },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/orders", label: "Orders", icon: Package },
] as const;

export function MobileNavDrawer({ whatsappUrl }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-[85vw] max-w-xs flex-col px-4 py-5"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Leaf className="h-4 w-4 text-primary" />
            <span>Nature&apos;s Nectar</span>
          </SheetTitle>
          <SheetDescription>
            Natural herbal wellness storefront
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile navigation" className="mt-6 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
            >
              <item.icon className="h-4 w-4 text-primary" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {whatsappUrl ? (
          <div className="border-t pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            <Button asChild variant="outline" className="min-h-11 w-full">
              <a
                href={whatsappUrl}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => setOpen(false)}
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
