import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from "@/config/site";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { cn } from "@/lib/utils";
import { getStorefrontCategories } from "@/server/services/category.service";
import { searchStorefrontProducts } from "@/server/services/product.service";

export const dynamic = "force-dynamic";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export async function generateMetadata(
  props: ProductsPageProps
): Promise<Metadata> {
  const params = await props.searchParams;
  const query = params.q?.trim();
  const title = query
    ? `Search: "${query}" — Herbal Wellness Products`
    : "Herbal Wellness Products";
  const description =
    "Browse herbal teas, organic supplements, mineral resins, and natural wellness products delivered across Kenya.";

  return {
    title,
    description,
    alternates: {
      canonical: "/products",
    },
    ...(query ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${title} | Nature's Nectar Wellness`,
      description,
      url: "/products",
      type: "website",
      images: [{ url: DEFAULT_OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Nature's Nectar Wellness`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ProductsPage(props: ProductsPageProps) {
  const params = await props.searchParams;
  const activeQuery = params.q?.trim() || "";
  const activeCategorySlug = params.category?.trim() || "";

  const [products, categories] = await Promise.all([
    searchStorefrontProducts({
      query: activeQuery || undefined,
      categorySlug: activeCategorySlug || undefined,
    }),
    getStorefrontCategories(),
  ]);

  const activeCategory = categories.find(
    (cat) => cat.slug === activeCategorySlug
  );

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: activeCategory
      ? `${activeCategory.name} — Herbal Wellness Products`
      : "Herbal Wellness Products",
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

  function buildFilterHref(nextCategorySlug?: string) {
    const nextParams = new URLSearchParams();
    if (activeQuery) {
      nextParams.set("q", activeQuery);
    }
    if (nextCategorySlug) {
      nextParams.set("category", nextCategorySlug);
    }
    const qs = nextParams.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      <div className="mb-8 space-y-5 border-b border-border/80 pb-6 sm:mb-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-medium text-primary">Botanical Catalog</p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {activeCategory ? activeCategory.name : "Products"}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Explore our small-batch herbal catalog. Live availability is shown
            on each product.
          </p>
        </div>

        {categories.length > 0 ? (
          <nav
            aria-label="Filter products by category"
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href={buildFilterHref(undefined)}
              className={cn(
                "inline-flex min-h-9 items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                !activeCategorySlug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildFilterHref(cat.slug)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeCategorySlug === cat.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span>{cat.name}</span>
                <span className="opacity-75">({cat.productCount})</span>
              </Link>
            ))}
          </nav>
        ) : null}

        {activeQuery || activeCategory ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
            <p>
              Showing <strong className="font-medium text-foreground">{products.length}</strong>{" "}
              {products.length === 1 ? "formulation" : "formulations"}
              {activeCategory ? ` in ${activeCategory.name}` : ""}
              {activeQuery ? ` matching "${activeQuery}"` : ""}.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Reset filters
            </Link>
          </div>
        ) : null}
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card p-8 text-center shadow-[0_1px_2px_rgba(24,42,32,0.04)]">
          <h2 className="font-display text-xl font-medium text-foreground">
            No matching formulations found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We couldn&apos;t find active products matching your filter. Try a
            broader botanical keyword or view the entire catalog.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="sm">
              <Link href="/products">View all formulations</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/categories">Explore categories</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
