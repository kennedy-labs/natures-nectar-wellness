import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, MessageCircle, ShieldCheck } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/config/site";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import { ProductMobilePurchaseBar } from "@/features/products/components/ProductMobilePurchaseBar";
import {
  createProductInquiryMessage,
  getProductInquiryUrl,
} from "@/features/whatsapp/utils/whatsapp.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getProductBySlug } from "@/server/services/product.service";

export const revalidate = 60;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  props: ProductPageProps
): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const description = (product.benefits ?? product.description).slice(0, 160);
  const canonicalPath = `/products/${product.slug}`;
  const ogImage =
    product.image && !product.image.startsWith("data:")
      ? product.image
      : DEFAULT_OG_IMAGE;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${product.name} | ${SITE_NAME}`,
      description,
      url: canonicalPath,
      type: "website",
      images: [{ url: ogImage, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const inventoryStatus = getInventoryStatus(product.stockQuantity);
  const whatsappUrl = getProductInquiryUrl(product.name);
  const productUrl = getAbsoluteUrl(`/products/${product.slug}`);
  const schemaImage =
    product.image && !product.image.startsWith("data:")
      ? getAbsoluteUrl(product.image)
      : getAbsoluteUrl(DEFAULT_OG_IMAGE);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [schemaImage],
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "KES",
      price: String(product.price),
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: getAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: getAbsoluteUrl("/products"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:py-12 md:pb-14">
      <WhatsAppPageContext message={createProductInquiryMessage(product.name)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:mb-8"
      >
        <Link
          href="/"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/products"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Products
        </Link>
        {product.category ? (
          <>
            <span aria-hidden="true">/</span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-12 md:gap-12">
        {/* Left Sticky 4:3 Gallery */}
        <div className="overflow-hidden rounded-xl border border-border bg-card md:sticky md:top-24 md:col-span-6">
          <div className="aspect-[4/3] bg-muted/45">
            {product.image ? (
              <SkeletonImage
                alt={product.name}
                src={product.image}
                priority
                useNextImage={!product.image.startsWith("data:")}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(31,78,55,0.08),transparent_70%)] px-8 text-center">
                <Leaf className="h-7 w-7 text-primary/70" />
                <span className="font-display text-sm font-medium text-muted-foreground">
                  Nature&apos;s Nectar Apothecary
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Contiguous Decision & Specification Column */}
        <div className="space-y-7 md:col-span-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              {product.category ? (
                <>
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {product.category.name}
                  </Link>
                  <span aria-hidden="true" className="text-muted-foreground/60">
                    ·
                  </span>
                </>
              ) : null}
              <span
                className={cn(
                  inventoryStatus === "OUT_OF_STOCK"
                    ? "text-destructive"
                    : inventoryStatus === "LOW_STOCK"
                      ? "text-amber-700"
                      : "text-primary"
                )}
              >
                {getInventoryStatusLabel(inventoryStatus)}
                {product.stockQuantity > 0
                  ? ` (${product.stockQuantity} left)`
                  : ""}
              </span>
            </div>

            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground text-balance sm:text-4xl">
              {product.name}
            </h1>

            <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          {/* Contiguous Purchase Module */}
          <div
            id="primary-purchase-module"
            className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-border/75 pb-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Price
                </p>
                <p className="mt-1 font-display text-2xl font-medium tabular-nums text-foreground sm:text-3xl">
                  {formatKes(product.price)}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  M-Pesa or Cash on Pickup
                </p>
                <p className="mt-0.5">Free Nairobi delivery</p>
              </div>
            </div>

            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                stockQuantity: product.stockQuantity,
                image: product.image,
              }}
            />

            {whatsappUrl ? (
              <Button
                asChild
                variant="outline"
                className="min-h-11 w-full gap-2 bg-background"
              >
                <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Ask on WhatsApp about this product</span>
                </a>
              </Button>
            ) : null}
          </div>

          {/* Editorial Hairline Specification Ledger */}
          {product.benefits || product.usageInstructions || product.ingredients ? (
            <div className="max-w-[62ch] divide-y divide-border border-y border-border text-sm">
              {product.benefits ? (
                <div className="py-4">
                  <h2 className="font-display text-base font-medium text-foreground">
                    Benefits
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {product.benefits}
                  </p>
                </div>
              ) : null}

              {product.usageInstructions ? (
                <div className="py-4">
                  <h2 className="font-display text-base font-medium text-foreground">
                    Preparation &amp; Usage
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {product.usageInstructions}
                  </p>
                </div>
              ) : null}

              {product.ingredients ? (
                <div className="py-4">
                  <h2 className="font-display text-base font-medium text-foreground">
                    Pure Ingredients
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {product.ingredients}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <aside
            aria-label="Delivery and wellness note"
            className="max-w-[62ch] space-y-1.5 text-xs leading-relaxed text-muted-foreground"
          >
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Delivery &amp; wellness note</span>
            </p>
            <p>
              Free collection at Kooni Mall, Nairobi and free drop-off within
              Nairobi. Natural formulations are offered for everyday wellbeing and
              are not intended to diagnose, treat, cure, or prevent any medical
              condition.{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </aside>
        </div>
      </div>

      <ProductMobilePurchaseBar
        targetElementId="primary-purchase-module"
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          stockQuantity: product.stockQuantity,
          image: product.image,
        }}
      />
    </section>
  );
}
