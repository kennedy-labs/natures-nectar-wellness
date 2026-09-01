import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getCategoryBySlug } from "@/server/services/category.service";
import { getProductsByCategorySlug } from "@/server/services/product.service";

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
    };
  }

  return {
    title: category.name,
    description:
      category.description ?? `Browse products in ${category.name}.`,
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategorySlug(category.slug);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-muted-foreground">{category.description}</p>
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

