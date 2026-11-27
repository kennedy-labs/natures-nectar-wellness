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
      <header className="mb-8 max-w-2xl space-y-2 border-b border-border pb-6 sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Curated Collections
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Botanical Categories
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Navigate our apothecary by botanical format — raw forest honey,
          whole-leaf herbal teas, mineral resins, and extracts.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_28px_-16px_rgba(20,34,27,0.14)]"
            href={`/categories/${category.slug}`}
            key={category.id}
          >
            {/* 16:10 Wide Architectural Frame */}
            <div className="relative aspect-[16/10] overflow-hidden border-b border-border/60 bg-muted/45">
              {category.image ? (
                <SkeletonImage
                  src={category.image}
                  alt={category.name}
                  useNextImage={!category.image.startsWith("data:")}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(31,78,55,0.09),transparent_72%)] px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-xs">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <span className="font-display text-xs tracking-wide text-muted-foreground">
                    {category.name}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <p className="text-xs font-medium tabular-nums text-primary">
                  {category.productCount}{" "}
                  {category.productCount === 1 ? "formulation" : "formulations"}
                </p>
                <h2 className="mt-1.5 font-display text-xl font-medium text-foreground transition-colors group-hover:text-primary">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                ) : null}
              </div>

              <span className="mt-5 inline-flex items-center gap-1.5 border-t border-border/70 pt-4 text-xs font-medium text-primary">
                <span>Browse collection</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
