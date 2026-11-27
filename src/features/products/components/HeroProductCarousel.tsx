"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type HeroProductCarouselProps = {
  products: Product[];
};

const AUTO_ROTATE_INTERVAL_MS = 5000;
const MAX_SPOTLIGHT_SLIDES = 6;

export function HeroProductCarousel({ products }: HeroProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Curate max 6 spotlight slides, prioritizing items with real photos & active stock
  const slides = useMemo(() => {
    const withPhotos = products.filter((p) => Boolean(p.image));
    const pool = withPhotos.length > 0 ? withPhotos : products;
    return pool.slice(0, MAX_SPOTLIGHT_SLIDES);
  }, [products]);

  const total = slides.length;
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;

  function scrollToIndex(targetIndex: number) {
    if (total === 0) return;
    const wrappedIndex = ((targetIndex % total) + total) % total;
    setActiveIndex(wrappedIndex);

    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({
      left: wrappedIndex * track.clientWidth,
      behavior: "smooth",
    });
  }

  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0 || total === 0) return;

    const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
    const bounded = Math.max(0, Math.min(total - 1, nextIndex));
    if (bounded !== activeIndex) {
      setActiveIndex(bounded);
    }
  }

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        const track = trackRef.current;
        if (track && track.clientWidth > 0) {
          track.scrollTo({
            left: next * track.clientWidth,
            behavior: "smooth",
          });
        }
        return next;
      });
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [total, isPaused]);

  if (total === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-border bg-card p-8 text-center lg:h-full lg:min-h-[400px]">
        <div className="space-y-2">
          <p className="font-display text-xl font-medium text-foreground">
            Nature&apos;s Nectar Apothecary
          </p>
          <p className="text-sm text-muted-foreground">
            Fresh herbal formulations will appear here shortly.
          </p>
        </div>
      </div>
    );
  }

  const formattedIndex = String(safeIndex + 1).padStart(2, "0");
  const formattedTotal = String(total).padStart(2, "0");

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured botanical spotlight"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollToIndex(safeIndex + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollToIndex(safeIndex - 1);
        }
      }}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_38px_-22px_rgba(20,34,27,0.18)]"
    >
      {/* Top Spotlight Rail */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="font-medium text-foreground">Featured Spotlight</span>
          <span aria-hidden="true" className="text-muted-foreground/60">
            ·
          </span>
          <span className="font-mono text-muted-foreground tabular-nums">
            {formattedIndex} / {formattedTotal}
          </span>
        </div>

        {total > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollToIndex(safeIndex - 1)}
              aria-label="Previous spotlight formulation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(safeIndex + 1)}
              aria-label="Next spotlight formulation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Carousel Track */}
      <div
        ref={trackRef}
        onScroll={handleTrackScroll}
        tabIndex={0}
        aria-label="Scroll horizontally through spotlight products"
        className="flex w-full flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((product, index) => {
          const inventoryStatus = getInventoryStatus(product.stockQuantity);
          const statusLabel = getInventoryStatusLabel(inventoryStatus);
          const summaryText =
            product.benefits?.trim() || product.description.trim();

          return (
            <article
              key={product.id}
              aria-roledescription="slide"
              aria-label={`${product.name} (${index + 1} of ${total})`}
              className="flex w-full min-w-0 shrink-0 snap-start flex-col"
            >
              <Link
                href={`/products/${product.slug}`}
                className="group relative block aspect-[4/3] w-full overflow-hidden border-b border-border/60 bg-muted/45"
              >
                {product.image ? (
                  <SkeletonImage
                    src={product.image}
                    alt={product.name}
                    priority={index === 0}
                    useNextImage={!product.image.startsWith("data:")}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-primary/70">
                    <Leaf className="h-6 w-6" />
                    <span className="font-display text-sm text-foreground">
                      {product.name}
                    </span>
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                    {product.category?.name ? (
                      <>
                        <span className="truncate font-medium text-muted-foreground">
                          {product.category.name}
                        </span>
                        <span aria-hidden="true" className="text-muted-foreground/60">
                          ·
                        </span>
                      </>
                    ) : null}
                    <span
                      className={cn(
                        "font-medium",
                        inventoryStatus === "OUT_OF_STOCK"
                          ? "text-destructive"
                          : inventoryStatus === "LOW_STOCK"
                            ? "text-amber-700"
                            : "text-primary"
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="line-clamp-1 block font-display text-xl font-medium leading-snug tracking-tight text-foreground transition-colors hover:text-primary"
                  >
                    {product.name}
                  </Link>

                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {summaryText}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/75 pt-3.5">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {formatKes(product.price)}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex h-9 items-center gap-1 px-2 text-xs font-medium text-primary underline-offset-4 hover:underline whitespace-nowrap shrink-0"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        slug: product.slug,
                        stockQuantity: product.stockQuantity,
                        image: product.image,
                      }}
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Crisp Hairline Progress Segments (max 6) */}
      {total > 1 ? (
        <div
          className="grid gap-1 border-t border-border px-4 py-2.5 sm:px-5"
          style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
          aria-label="Select spotlight product"
        >
          {slides.map((product, index) => {
            const isActive = index === safeIndex;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Show ${product.name}`}
                aria-current={isActive ? "true" : undefined}
                className="group py-1 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "block h-0.5 w-full transition-colors duration-200",
                    isActive
                      ? "bg-primary"
                      : "bg-border group-hover:bg-muted-foreground/50"
                  )}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
