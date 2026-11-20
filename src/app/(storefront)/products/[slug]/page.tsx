import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DEFAULT_OG_IMAGE, SITE_NAME, getAbsoluteUrl } from "@/config/site";
import { formatKes } from "@/lib/format";
import { getProductBySlug } from "@/server/services/product.service";
import { getInventoryStatus, getInventoryStatusLabel } from "@/features/inventory/utils/inventory.utils";
import { getProductInquiryUrl } from "@/features/whatsapp/utils/whatsapp.utils";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    <section className="mx-auto max-w-4xl px-4 py-10">
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
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="aspect-[4/3] bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={product.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                src={product.image}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm font-medium text-muted-foreground">
                Nature&apos;s Nectar
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                {product.name}
              </h1>
              {product.isFeatured ? (
                <Badge variant="secondary">Featured</Badge>
              ) : null}
              <Badge
                variant={
                  inventoryStatus === "OUT_OF_STOCK" ? "destructive" : "secondary"
                }
              >
                {getInventoryStatusLabel(inventoryStatus)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-2xl font-semibold">{formatKes(product.price)}</p>
            <p className="text-sm text-muted-foreground">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} in stock`
                : "Currently out of stock"}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            {product.benefits ? (
              <div>
                <h2 className="font-medium">Benefits</h2>
                <p className="mt-1 text-muted-foreground">{product.benefits}</p>
              </div>
            ) : null}

            {product.usageInstructions ? (
              <div>
                <h2 className="font-medium">Usage</h2>
                <p className="mt-1 text-muted-foreground">
                  {product.usageInstructions}
                </p>
              </div>
            ) : null}

            {product.ingredients ? (
              <div>
                <h2 className="font-medium">Ingredients</h2>
                <p className="mt-1 text-muted-foreground">
                  {product.ingredients}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
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
              <Button asChild variant="outline">
                <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                  Ask about this on WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
