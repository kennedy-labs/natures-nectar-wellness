import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from "@/config/site";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createCategoryInquiryMessage } from "@/features/whatsapp/utils/whatsapp.utils";
import { cn } from "@/lib/utils";
import {
  getCategoryBySlug,
  getStorefrontCategories,
} from "@/server/services/category.service";
import { getProductsByCategorySlug } from "@/server/services/product.service";

export const revalidate = 60;

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  props: CategoryPageProps
): Promise<Metadata> {
  const params = await props.params;
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    return {
      title: "Category not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    category.description ??
    `Shop natural wellness products in ${category.name}, delivered across Kenya.`;
  const canonicalPath = `/categories/${category.slug}`;
  const ogImage =
    category.image && !category.image.startsWith("data:")
      ? category.image
      : DEFAULT_OG_IMAGE;

  return {
    title: category.name,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${category.name} | Nature's Nectar Wellness`,
      description,
      url: canonicalPath,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | Nature's Nectar Wellness`,
      description,
      images: [ogImage],
    },
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const [category, allCategories] = await Promise.all([
    getCategoryBySlug(params.slug),
    getStorefrontCategories(),
  ]);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategorySlug(category.slug);
  const siblingCategories = allCategories.filter(
    (item) => item.slug !== category.slug
  );

  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description:
      category.description ?? `Browse products in ${category.name}.`,
    url: getAbsoluteUrl(`/categories/${category.slug}`),
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <WhatsAppPageContext
        message={createCategoryInquiryMessage(category.name)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categorySchema),
        }}
      />

      <header className="mb-8 space-y-5 border-b border-border pb-6 sm:mb-10">
        <div className="max-w-2xl space-y-2">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Link
              href="/categories"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Categories
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-primary">{category.name}</span>
          </nav>

          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {category.name}
            </h1>
            <span className="text-sm text-muted-foreground tabular-nums">
              {products.length}{" "}
              {products.length === 1 ? "formulation" : "formulations"}
            </span>
          </div>

          {category.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {category.description}
            </p>
          ) : null}
        </div>

        {/* Sibling Collections Switcher */}
        {siblingCategories.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Other collections:
            </span>
            {siblingCategories.map((sibling) => (
              <Link
                key={sibling.id}
                href={`/categories/${sibling.slug}`}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                )}
              >
                {sibling.name}
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No products in this collection yet.
          </p>
        </div>
      )}
    </section>
  );
}
