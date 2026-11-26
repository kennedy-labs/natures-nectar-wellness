import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/config/site";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getProductBySlug } from "@/server/services/product.service";
import { getInventoryStatus, getInventoryStatusLabel } from "@/features/inventory/utils/inventory.utils";
import {
  createProductInquiryMessage,
  getProductInquiryUrl,
} from "@/features/whatsapp/utils/whatsapp.utils";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { SkeletonImage } from "@/components/ui/skeleton-image";

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
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
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
        <Link href="/" className="hover:text-foreground hover:underline underline-offset-4">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/products" className="hover:text-foreground hover:underline underline-offset-4">
          Products
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)] md:gap-10">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_3px_rgba(24,42,32,0.05)] md:sticky md:top-24">
          <div className="aspect-[4/3] bg-muted/50">
            {product.image ? (
              <SkeletonImage
                alt={product.name}
                src={product.image}
                priority
                useNextImage={!product.image.startsWith("data:")}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center font-display text-sm font-medium text-muted-foreground">
                Nature&apos;s Nectar
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              {product.isFeatured ? (
                <>
                  <span className="text-primary">Featured selection</span>
                  <span aria-hidden="true" className="text-muted-foreground">·</span>
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
              </span>
            </div>

            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-4 rounded-xl border border-border/80 bg-card p-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Price</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {formatKes(product.price)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} in stock`
                : "Currently out of stock"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              <Button asChild variant="outline" className="w-full min-h-11 sm:w-auto">
                <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                  Ask about this on WhatsApp
                </a>
              </Button>
            ) : null}
          </div>

          {(product.benefits || product.usageInstructions || product.ingredients) ? (
            <div className="divide-y divide-border/70 border-t border-border/70 pt-2 text-sm">
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
                    Usage
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {product.usageInstructions}
                  </p>
                </div>
              ) : null}

              {product.ingredients ? (
                <div className="py-4">
                  <h2 className="font-display text-base font-medium text-foreground">
                    Ingredients
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">
                    {product.ingredients}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <aside
            aria-label="Wellness disclaimer"
            className="border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground"
          >
            <p className="font-medium text-foreground">Wellness note</p>
            <p className="mt-1">
              Natural formulations are offered for everyday wellbeing and are not
              intended to diagnose, treat, cure, or prevent any medical
              condition. Consult a qualified healthcare professional before use
              if you are pregnant, nursing, taking medication, or managing a
              health condition.{" "}
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
    </section>
  );
}
