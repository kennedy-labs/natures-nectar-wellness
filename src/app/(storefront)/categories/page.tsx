import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DEFAULT_OG_IMAGE } from "@/config/site";
import { getCategoryFallbackImage } from "@/lib/media";
import { getStorefrontCategories } from "@/server/services/category.service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Wellness Categories",
  description:
    "Explore natural wellness categories including herbal teas, raw honey, tinctures, and mineral resins delivered across Kenya.",
  alternates: {
    canonical: "/categories",
  },
  openGraph: {
    title: "Wellness Categories | Nature's Nectar Wellness",
    description:
      "Explore natural wellness categories including herbal teas, raw honey, tinctures, and mineral resins delivered across Kenya.",
    url: "/categories",
    locale: "en_KE",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wellness Categories | Nature's Nectar Wellness",
    description:
      "Explore natural wellness categories including herbal teas, raw honey, tinctures, and mineral resins delivered across Kenya.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function CategoriesPage() {
  const categories = await getStorefrontCategories();

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 max-w-2xl space-y-2 border-b border-border/80 pb-6 sm:mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Curated Collections
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Apothecary Categories
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Explore formulations grouped by botanical origin — cold-pressed raw
          honey, highland herbal teas, mineral resins, and daily supplements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const catImage =
            category.image || getCategoryFallbackImage(category.slug);
          const isDynamicMedia =
            catImage.startsWith("/api/media/") || catImage.startsWith("data:");

          return (
            <Link
              className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(24,42,32,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_30px_-14px_rgba(24,42,32,0.18)]"
              href={`/categories/${category.slug}`}
              key={category.id}
            >
              <Image
                alt={category.name}
                src={catImage}
                fill
                unoptimized={isDynamicMedia}
                referrerPolicy="no-referrer"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="relative z-10 p-5 text-white">
                <h2 className="font-display text-xl font-medium tracking-tight">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/85 sm:text-sm">
                    {category.description}
                  </p>
                ) : null}
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 transition-colors group-hover:text-amber-200">
                  Browse collection
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
