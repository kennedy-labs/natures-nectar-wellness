import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";

import { InlineBotanicalSearch } from "@/components/layout/InlineBotanicalSearch";
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

      {/* Unified Catalog Command Header */}
      <header className="mb-8 space-y-6 border-b border-border pb-6 sm:mb-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Botanical Catalog
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                {activeCategory ? activeCategory.name : "All Formulations"}
              </h1>
              <span className="text-sm text-muted-foreground tabular-nums">
                {products.length}{" "}
                {products.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Small-batch herbal teas, raw honey, resins, and natural
              formulations with live stock clarity.
            </p>
          </div>

          <InlineBotanicalSearch
            key={activeQuery}
            variant="subbar"
            initialQuery={activeQuery}
            placeholder="Filter by herb, benefit, ingredient..."
            className="w-full lg:max-w-sm"
          />
        </div>

        {/* Single-line Horizontal Segmented Category Bar */}
        {categories.length > 0 ? (
          <nav
            aria-label="Filter products by category"
            className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <Link
              href={buildFilterHref(undefined)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-colors",
                !activeCategorySlug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={buildFilterHref(cat.slug)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-colors",
                  activeCategorySlug === cat.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <span>{cat.name}</span>
                <span className="opacity-75 tabular-nums">
                  ({cat.productCount})
                </span>
              </Link>
            ))}
          </nav>
        ) : null}

        {activeQuery || activeCategory ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:text-sm">
            <p>
              Showing{" "}
              <strong className="font-semibold tabular-nums text-foreground">
                {products.length}
              </strong>{" "}
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
      </header>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="font-display text-xl font-medium text-foreground">
            No matching formulations found
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            No active products match your current filter. Reset your filters or
            explore categories above.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="sm">
              <Link href="/products">Reset filters</Link>
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
