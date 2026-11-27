import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { InlineBotanicalSearch } from "@/components/layout/InlineBotanicalSearch";
import { StorefrontWhatsAppInvitation } from "@/components/layout/StorefrontWhatsAppInvitation";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/config/site";
import { HeroProductCarousel } from "@/features/products/components/HeroProductCarousel";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  getAllProducts,
  getFeaturedProducts,
  getPopularProducts,
} from "@/server/services/product.service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function HomePage() {
  const [allProducts, popularProducts, featuredProducts] = await Promise.all([
    getAllProducts(),
    getPopularProducts(6),
    getFeaturedProducts(),
  ]);

  const popularIds = new Set(popularProducts.map((product) => product.id));
  const distinctFeatured = featuredProducts.filter(
    (product) => !popularIds.has(product.id)
  );

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:gap-14 sm:px-6 sm:py-12 md:gap-16 md:py-14">
      <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col justify-center space-y-6 lg:col-span-6">
          <div className="space-y-4">
            <p className="text-sm font-medium tracking-wide text-primary">
              Kenyan Botanical Apothecary
            </p>
            <h1 className="font-display text-[clamp(2.1rem,4vw,3.3rem)] font-medium leading-[1.12] tracking-tight text-foreground text-balance">
              Herbal products for everyday balance and wellbeing
            </h1>
            <p className="max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Browse teas, raw forest honey, mineral resins, and natural
              supplements. Order online with direct M-Pesa or Cash on Pickup and
              personal delivery coordination across Kenya.
            </p>
          </div>

          <InlineBotanicalSearch
            variant="hero"
            placeholder="Search raw honey, shilajit, hibiscus tea..."
            className="max-w-lg"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
              <Link href="/products">
                Browse collection
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
            >
              <Link href="/categories">Explore categories</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs text-muted-foreground sm:text-sm">
            <span>Small-batch sourcing</span>
            <span aria-hidden="true">·</span>
            <span>M-Pesa &amp; Cash on Pickup</span>
            <span aria-hidden="true">·</span>
            <span>Countrywide delivery</span>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-6">
          <HeroProductCarousel products={allProducts} />
        </div>
      </div>

      <div className="grid gap-6 border-y border-border/80 py-8 md:grid-cols-3 md:gap-8">
        <div className="space-y-1.5">
          <h2 className="font-display text-base font-medium text-foreground">
            01. Trusted sourcing
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Botanical harvests selected for purity, clarity, and everyday
            wellness support.
          </p>
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-base font-medium text-foreground">
            02. Direct M-Pesa &amp; WhatsApp care
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Checkout seamlessly online with instant M-Pesa prompt or personal
            WhatsApp coordination.
          </p>
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-base font-medium text-foreground">
            03. Delivery across Kenya
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Free pickup and Nairobi delivery alongside flexible countrywide
            courier dispatch.
          </p>
        </div>
      </div>

      {popularProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                {distinctFeatured.length > 0
                  ? "Popular in Kenya"
                  : "Popular & Featured Formulations"}
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Most-ordered botanical favorites and trusted daily essentials
                from our apothecary.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              View all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={popularProducts} />
        </div>
      ) : null}

      {distinctFeatured.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Featured Formulations
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Handpicked herbal essentials highlighted from our apothecary.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              Browse full catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ProductGrid products={distinctFeatured} />
        </div>
      ) : null}

      <StorefrontWhatsAppInvitation />
    </section>
  );
}
