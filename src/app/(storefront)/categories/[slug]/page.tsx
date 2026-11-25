import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DEFAULT_OG_IMAGE, getAbsoluteUrl } from "@/config/site";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getCategoryBySlug } from "@/server/services/category.service";
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
      locale: "en_KE",
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
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategorySlug(category.slug);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(categorySchema),
        }}
      />
      <div className="mb-8 max-w-2xl space-y-2 border-b border-border/80 pb-6 sm:mb-10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/categories" className="hover:text-foreground hover:underline underline-offset-4">
            Categories
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-primary font-medium">{category.name}</span>
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {category.description}
          </p>
        ) : null}
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No products in this category yet.
        </p>
      )}
    </section>
  );
}
