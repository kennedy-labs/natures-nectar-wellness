import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import { DEFAULT_OG_IMAGE } from "@/config/site";
import { getStorefrontCategories } from "@/server/services/category.service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wellness Categories",
  description:
    "Explore natural wellness categories including herbal teas, supplements, tinctures, and mineral resins.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Wellness Categories | Nature's Nectar Wellness",
    description:
      "Explore natural wellness categories including herbal teas, supplements, tinctures, and mineral resins.",
    url: "/categories",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wellness Categories | Nature's Nectar Wellness",
    description:
      "Explore natural wellness categories including herbal teas, supplements, tinctures, and mineral resins.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function CategoriesPage() {
  const categories = await getStorefrontCategories();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 max-w-2xl space-y-2 border-b border-border/80 pb-6 sm:mb-10">
        <p className="text-sm font-medium text-primary">Curated Collections</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Categories
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Explore formulations grouped by botanical type — teas, honey,
          tinctures, resins, and daily supplements.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_1px_2px_rgba(24,42,32,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_28px_-14px_rgba(24,42,32,0.14)]"
            href={`/categories/${category.slug}`}
            key={category.id}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-muted/50">
              {category.image ? (
                <SkeletonImage
                  src={category.image}
                  alt={category.name}
                  useNextImage={!category.image.startsWith("data:")}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(47,93,67,0.10),transparent_70%)] text-primary/70">
                  <Leaf className="h-7 w-7" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <p className="text-xs font-medium text-primary">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "formulation" : "formulations"}
                </p>
                <h2 className="mt-1 font-display text-xl font-medium text-foreground transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                Browse collection
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
