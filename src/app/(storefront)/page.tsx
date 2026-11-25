import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, MessageCircle } from "lucide-react";

import heroApothecaryImg from "@/assets/images/hero_botanical_apothecary_1795510308614.jpg";
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_TITLE,
  getAbsoluteUrl,
} from "@/config/site";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getCategoryFallbackImage } from "@/lib/media";
import { getStorefrontCategories } from "@/server/services/category.service";
import { getPaymentGatewayAvailability } from "@/server/services/payment-gateway.service";
import { getFeaturedProducts } from "@/server/services/product.service";

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
    locale: "en_KE",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

const FALLBACK_CATEGORIES = [
  {
    name: "Herbal Teas & Infusions",
    slug: "herbal-blends",
    image: "/images/hibiscus-tisane.jpg",
    description: "Loose-leaf & botanical blends",
  },
  {
    name: "Raw Honey & Resins",
    slug: "honey-resins",
    image: "/images/mau-forest-honey.jpg",
    description: "Mau Forest & Pure Shilajit",
  },
  {
    name: "Daily Vitality & Tinctures",
    slug: "supplements",
    image: "/images/ashwagandha-tincture.jpg",
    description: "Ashwagandha, Moringa & Sea Moss",
  },
  {
    name: "Skin & Botanical Balms",
    slug: "topicals",
    image: "/images/neem-balm.jpg",
    description: "Cold-pressed neem & beeswax",
  },
];

export default async function HomePage() {
  const [featuredProducts, dbCategories] = await Promise.all([
    getFeaturedProducts(),
    getStorefrontCategories(),
  ]);
  const { darajaEnabled } = getPaymentGatewayAvailability();

  const categoriesToShow =
    dbCategories.length > 0
      ? dbCategories.slice(0, 4).map((cat) => ({
          name: cat.name,
          slug: cat.slug,
          image: cat.image || getCategoryFallbackImage(cat.slug),
          description: cat.description || "Curated Kenyan botanicals",
        }))
      : FALLBACK_CATEGORIES;

  const featuredSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular Wellness Products",
    itemListElement: featuredProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getAbsoluteUrl(`/products/${product.slug}`),
      name: product.name,
    })),
  };

  return (
    <div className="flex flex-col gap-6 pb-14 sm:gap-12 sm:pb-16 md:gap-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(featuredSchema),
        }}
      />

      {/* 1. PHONE-FIRST VALUE HERO (Visual First on Mobile + Above-the-Fold Product Peek) */}
      <section className="border-b border-border/70 bg-gradient-to-b from-card/85 to-background px-4 pt-3 pb-4 sm:px-6 sm:pt-8 sm:pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-stretch gap-3.5 sm:gap-6 lg:grid-cols-12 lg:gap-10">
            {/* Botanical Spotlight Image: Shown First on Phones for Instant Recognition, Right on Desktop */}
            <div className="order-first lg:order-last lg:col-span-6">
              <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border/80 bg-muted/40 shadow-[0_10px_26px_-14px_rgba(26,66,45,0.2)] sm:h-56 sm:rounded-2xl lg:h-full lg:min-h-[320px]">
                <Image
                  src={heroApothecaryImg}
                  alt="Natural Kenyan herbal remedies, raw Mau Forest honey, amber tincture bottle, and dried hibiscus"
                  fill
                  priority
                  placeholder="blur"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Value Proposition & Primary Actions */}
            <div className="order-last flex flex-col justify-center space-y-2.5 sm:space-y-4 lg:order-first lg:col-span-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
                Natural Wellness Store · Kenya
              </p>

              <h1 className="font-display text-[1.55rem] font-semibold leading-[1.12] tracking-tight text-foreground text-balance sm:text-[clamp(1.95rem,3.6vw,3rem)]">
                Natural herbal remedies &amp; raw forest honey
              </h1>

              <p className="max-w-[54ch] text-xs leading-relaxed text-muted-foreground sm:text-base">
                Pure Kenyan herbs, raw Mau Forest honey, and daily supplements — delivered fast across all 47 counties.
              </p>

              {/* Action Hierarchy: 1 Primary + 1 Secondary */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 sm:gap-3 sm:pt-1">
                <a
                  href="#trending-products"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 whitespace-nowrap sm:min-h-11 sm:px-6 sm:text-sm"
                >
                  Shop Products
                  <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2" />
                </a>

                <Link
                  href="/categories"
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted whitespace-nowrap sm:min-h-11 sm:px-5 sm:text-sm"
                >
                  Categories
                </Link>
              </div>

              {/* Clean Unboxed Trust Marker */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground sm:gap-x-2.5 sm:pt-1 sm:text-sm">
                <span className="font-medium text-foreground">Nairobi Same-Day Delivery</span>
                <span aria-hidden="true">·</span>
                <span>
                  {darajaEnabled
                    ? "Instant M-Pesa & WhatsApp Care"
                    : "Pay on WhatsApp or Pickup"}
                </span>
                <span aria-hidden="true">·</span>
                <span>Purity Tested</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. IMMEDIATE 2-COL MOBILE / 4-COL DESKTOP PRODUCT GRID */}
      <section id="trending-products" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
              Featured Selection
            </p>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Popular Wellness Products
            </h2>
            <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">
              Handcrafted in small batches and lab-tested for natural purity.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : null}
      </section>

      {/* 3. VISUAL CATEGORY DISCOVERY GRID (2x2 Mobile / 4-Col Desktop) */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-4 space-y-1 sm:mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
            Browse By Need
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Shop by Category
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Targeted herbal collections for immunity, restful sleep, and daily energy.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categoriesToShow.map((cat) => {
            const isDynamicMedia =
              cat.image.startsWith("/api/media/") ||
              cat.image.startsWith("data:");

            return (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/80 bg-muted shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  unoptimized={isDynamicMedia}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                  <h3 className="font-display text-sm font-semibold leading-snug sm:text-base">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80">
                    {cat.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. SOCIAL PROOF & RELIABILITY STRIP */}
      <section className="border-y border-border/80 bg-card/60 px-4 py-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3 sm:gap-8">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-foreground">
                01. Verified Natural Purity
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Clean harvests sourced from indigenous Kenyan forests and mineral seams, zero artificial additives.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#168A47]/10 text-[#168A47]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-foreground">
                02. {darajaEnabled ? "WhatsApp & M-Pesa Care" : "Direct WhatsApp Care"}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {darajaEnabled
                  ? "Confirm your order directly on WhatsApp or pay seamlessly online via Safaricom M-Pesa STK push."
                  : "Confirm your order directly on WhatsApp with a real person, or choose Cash on Pickup."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
              <Truck className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-foreground">
                03. Fast Kenya Delivery
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Same-day rider delivery in Nairobi and reliable next-day parcel delivery to all 47 counties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROVENANCE & PURITY */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Our Quality Standard
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
                Traditional wisdom backed by clean lab testing
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every jar of Mau Forest honey is raw and unpasteurized, retaining its natural pollen and enzymes. Our Shilajit resin is purified and tested to ensure clean, reliable quality.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>Unfiltered Mau Honey</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>Heavy Metal Tested</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>UV-Protected Glass Jars</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{darajaEnabled ? "Instant M-Pesa & Pickup" : "WhatsApp & Cash on Pickup"}</span>
                </div>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted/60 lg:col-span-5">
              <Image
                src="/images/shilajit-resin.jpg"
                alt="High-altitude purified mineral Shilajit resin in amber apothecary jar"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
