import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from "@/config/site";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getAllProducts } from "@/server/services/product.service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Herbal Wellness Products",
  description:
    "Browse herbal teas, organic supplements, mineral resins, and natural wellness products delivered across Kenya.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Herbal Wellness Products | Nature's Nectar Wellness",
    description:
      "Browse herbal teas, organic supplements, mineral resins, and natural wellness products delivered across Kenya.",
    url: "/products",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Herbal Wellness Products | Nature's Nectar Wellness",
    description:
      "Browse herbal teas, organic supplements, mineral resins, and natural wellness products delivered across Kenya.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Herbal Wellness Products",
    url: getAbsoluteUrl("/products"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: getAbsoluteUrl(`/products/${product.slug}`),
        name: product.name,
      })),
    },
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <div className="mb-8 max-w-2xl space-y-2 border-b border-border/80 pb-6 sm:mb-10">
        <p className="text-sm font-medium text-primary">Botanical Catalog</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Products
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Explore our small-batch herbal catalog. Live availability is shown on
          each product.
        </p>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No products available yet. Please check back soon.
        </p>
      )}
    </section>
  );
}
