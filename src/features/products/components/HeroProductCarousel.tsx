"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type HeroProductCarouselProps = {
  products: Product[];
};

const AUTO_ROTATE_INTERVAL_MS = 5000;
const MAX_HERO_SLIDES = 6;

export function HeroProductCarousel({ products }: HeroProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollResetTimerRef = useRef<number | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const inStock = products.filter((p) => p.stockQuantity > 0);
    const pool = inStock.length > 0 ? inStock : products;
    const featured = pool.filter((p) => p.isFeatured);
    const nonFeatured = pool.filter((p) => !p.isFeatured);
    return [...featured, ...nonFeatured].slice(0, MAX_HERO_SLIDES);
  }, [products]);

  const total = slides.length;
  const safeSlideIndex = total > 0 ? Math.min(slideIndex, total - 1) : 0;

  function syncTrackPosition(targetSlide: number) {
    isProgrammaticScrollRef.current = true;
    if (scrollResetTimerRef.current !== null) {
      window.clearTimeout(scrollResetTimerRef.current);
    }
    scrollResetTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      scrollResetTimerRef.current = null;
    }, 420);

    window.requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth <= 0) return;
      track.scrollTo({
        left: targetSlide * track.clientWidth,
        behavior: "smooth",
      });
    });
  }

  function selectSlide(targetSlide: number) {
    if (total === 0) return;
    const bounded = ((targetSlide % total) + total) % total;
    setSlideIndex(bounded);
    syncTrackPosition(bounded);
  }

  function handleTrackScroll() {
    if (isProgrammaticScrollRef.current) return;
    const track = trackRef.current;
    if (!track || track.clientWidth <= 0 || total === 0) return;
    const nextSlide = Math.max(
      0,
      Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth))
    );
    if (nextSlide !== safeSlideIndex) {
      setSlideIndex(nextSlide);
    }
  }

  useEffect(() => {
    return () => {
      if (scrollResetTimerRef.current !== null) {
        window.clearTimeout(scrollResetTimerRef.current);
      }
    };
  }, []);

  const stepForwardRef = useRef(() => {});
  useEffect(() => {
    stepForwardRef.current = () => {
      if (total <= 1) return;
      const next = (safeSlideIndex + 1) % total;
      setSlideIndex(next);
      syncTrackPosition(next);
    };
  }, [safeSlideIndex, total]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setTimeout(
      () => stepForwardRef.current(),
      AUTO_ROTATE_INTERVAL_MS
    );
    return () => window.clearTimeout(timer);
  }, [isPaused, total, safeSlideIndex]);

  if (total === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-border/80 bg-card/70 p-6 text-center">
        <p className="font-display text-base text-muted-foreground">
          Nature&apos;s Nectar Apothecary
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Botanical formulations"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          selectSlide(safeSlideIndex + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          selectSlide(safeSlideIndex - 1);
        }
      }}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card/80"
    >
      {/* Quiet Swipeable Track */}
      <div
        ref={trackRef}
        onScroll={handleTrackScroll}
        tabIndex={0}
        aria-label="Swipe horizontally through products"
        className="flex w-full snap-x snap-mandatory overflow-x-auto focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((product, index) => (
          <article
            key={product.id}
            aria-roledescription="slide"
            aria-label={`${product.name} (${index + 1} of ${total})`}
            className="flex w-full min-w-0 shrink-0 snap-start flex-col"
          >
            <Link
              href={`/products/${product.slug}`}
              className="group relative block aspect-[16/10] w-full overflow-hidden border-b border-border/50 bg-muted/35"
            >
              {product.image ? (
                <SkeletonImage
                  src={product.image}
                  alt={product.name}
                  priority={index === 0}
                  useNextImage={!product.image.startsWith("data:")}
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center text-primary/60">
                  <Leaf className="h-5 w-5" />
                  <span className="font-display text-sm text-foreground">
                    {product.name}
                  </span>
                </div>
              )}
            </Link>

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <Link
                  href={`/products/${product.slug}`}
                  className="line-clamp-1 block font-display text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  {product.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  {formatKes(product.price)}
                </p>
              </div>

              <div className="shrink-0">
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
          </article>
        ))}
      </div>

      {/* Minimal Hairline Progress + Quiet Step Arrows */}
      {total > 1 ? (
        <div className="flex items-center gap-3 border-t border-border/60 px-4 py-2">
          <div
            className="grid flex-1 gap-1"
            style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
            aria-label="Select product slide"
          >
            {slides.map((product, index) => {
              const isActive = index === safeSlideIndex;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => selectSlide(index)}
                  aria-label={`Show ${product.name}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group py-1.5 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "block h-0.5 w-full transition-colors duration-200",
                      isActive
                        ? "bg-primary/80"
                        : "bg-border group-hover:bg-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => selectSlide(safeSlideIndex - 1)}
              aria-label="Previous product"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => selectSlide(safeSlideIndex + 1)}
              aria-label="Next product"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
