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

  const featuredIds = new Set(featuredProducts.map((product) => product.id));
  const popularBackfill = popularProducts.filter(
    (product) => !featuredIds.has(product.id)
  );

  // Admin-curated featured formulations lead Apothecary Selection (up to 6),
  // with popular formulations backfilling any remaining slots.
  const showcaseProducts = [...featuredProducts, ...popularBackfill].slice(
    0,
    6
  );

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:gap-14 sm:px-6 sm:py-12 md:gap-16 md:py-14">
      {/* Band 1: 55/45 Asymmetric Hero Split */}
      <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col justify-center space-y-6 lg:col-span-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Kenyan Botanical Apothecary
            </p>
            <h1 className="font-display text-[clamp(2.15rem,4.1vw,3.35rem)] font-medium leading-[1.1] tracking-tight text-foreground text-balance">
              Herbal formulations shaped for everyday balance and trust
            </h1>
            <p className="max-w-[50ch] text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              Small-batch teas, raw forest honey, mineral resins, and natural
              supplements delivered across Kenya with transparent pricing.
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
              className="min-h-11 w-full bg-card sm:w-auto"
            >
              <Link href="/categories">Explore categories</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs text-muted-foreground sm:text-sm">
            <span>Small-batch sourcing</span>
            <span aria-hidden="true">·</span>
            <span>M-Pesa &amp; Cash on Pickup</span>
            <span aria-hidden="true">·</span>
            <span>Countrywide dispatch</span>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-6">
          <HeroProductCarousel
            products={
              allProducts.length > 0 ? allProducts : showcaseProducts
            }
          />
        </div>
      </div>

      {/* Band 2: 3-Pillar Hairline Proof Strip */}
      <div className="grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="space-y-1.5 py-6 md:py-8 md:pr-8">
          <p className="font-mono text-xs text-primary">01</p>
          <h2 className="font-display text-lg font-medium text-foreground">
            Verified purity
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Botanical harvests selected for clarity, honest labeling, and daily
            wellness support.
          </p>
        </div>
        <div className="space-y-1.5 py-6 md:px-8 md:py-8">
          <p className="font-mono text-xs text-primary">02</p>
          <h2 className="font-display text-lg font-medium text-foreground">
            Direct M-Pesa &amp; WhatsApp care
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Seamless online M-Pesa prompt or Cash on Pickup backed by responsive
            human care.
          </p>
        </div>
        <div className="space-y-1.5 py-6 md:py-8 md:pl-8">
          <p className="font-mono text-xs text-primary">03</p>
          <h2 className="font-display text-lg font-medium text-foreground">
            Predictable Kenya-wide dispatch
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Free Nairobi pickup and local drop-off alongside quoted countrywide
            courier delivery.
          </p>
        </div>
      </div>

      {/* Band 3: Curated 3-Column Collection Grid */}
      {showcaseProducts.length > 0 ? (
        <div className="space-y-7">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Apothecary Selection
            </p>
            <h2 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Popular &amp; Essential Formulations
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Most-ordered botanical favorites and trusted daily essentials.
            </p>
          </div>

          <ProductGrid products={showcaseProducts} />

          <div className="flex justify-center pt-1">
            <Link
              href="/products"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              <span>View all products</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Band 4: Quiet WhatsApp Concierge Strip */}
      <StorefrontWhatsAppInvitation />
    </section>
  );
}
