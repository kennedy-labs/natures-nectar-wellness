import type { Metadata } from "next";
import Link from "next/link";

import { getAllCategories } from "@/server/services/category.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories | Nature's Nectar Wellness",
  description: "Browse wellness products by category.",
};

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Find products grouped by type — supplements, teas, and more.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="rounded-lg border bg-card p-5 text-card-foreground transition-colors hover:border-primary/30"
            href={`/categories/${category.slug}`}
            key={category.id}
          >
            <h2 className="font-medium">{category.name}</h2>
            {category.description ? (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {category.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
