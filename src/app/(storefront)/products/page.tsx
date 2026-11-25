import { Suspense } from "react";
import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from "@/config/site";
import { CatalogView } from "@/features/products/components/CatalogView";
import { getAllProducts } from "@/server/services/product.service";
import { getStorefrontCategories } from "@/server/services/category.service";

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
    locale: "en_KE",
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

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
  }>;
};

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const initialCategory = Array.isArray(searchParams?.category)
    ? searchParams.category[0]
    : searchParams?.category;

  const [products, categories] = await Promise.all([
    getAllProducts(),
    getStorefrontCategories(),
  ]);

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
      <div className="mb-6 max-w-2xl space-y-2 border-b border-border/80 pb-6 sm:mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Botanical Catalog</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Apothecary Formulations
        </h1>
        <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
          Explore our small-batch herbal remedies, raw Mau Forest honey, and wild-harvested mineral resins with direct M-Pesa dispatch.
        </p>
      </div>

      <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Loading formulations...</div>}>
        <CatalogView
          products={products}
          categories={categories}
          initialCategory={initialCategory}
        />
      </Suspense>
    </section>
  );
}
