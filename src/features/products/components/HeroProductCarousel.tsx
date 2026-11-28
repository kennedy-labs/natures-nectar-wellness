"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import type { Product } from "@/features/products/types/product.types";
import {
  buildCategoryDecks,
  dealStageBatch,
  shuffleDecksWithoutImmediateRepeat,
  STAGE_SIZE,
  type CategoryDeck,
} from "@/features/products/utils/carousel-rotation.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type HeroProductCarouselProps = {
  products: Product[];
};

type ScrollerState = {
  decks: CategoryDeck[];
  catIndex: number;
  slideIndex: number;
};

const AUTO_ROTATE_INTERVAL_MS = 5000;

export function HeroProductCarousel({ products }: HeroProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const catRailRef = useRef<HTMLDivElement | null>(null);
  const catBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const edgeSwipeRef = useRef<{ x: number; startSlide: number } | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollResetTimerRef = useRef<number | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [view, setView] = useState<ScrollerState>(() => ({
    decks: buildCategoryDecks(products, false),
    catIndex: 0,
    slideIndex: 0,
  }));

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setView({
        decks: buildCategoryDecks(products, true),
        catIndex: 0,
        slideIndex: 0,
      });
    });
    return () => {
      window.cancelAnimationFrame(rafId);
      if (scrollResetTimerRef.current !== null) {
        window.clearTimeout(scrollResetTimerRef.current);
      }
    };
  }, [products]);

  const decks = view.decks;
  const safeCatIndex =
    decks.length > 0 ? Math.min(view.catIndex, decks.length - 1) : 0;
  const currentCat = decks[safeCatIndex];
  const slides = currentCat?.stage ?? [];
  const total = slides.length;
  const safeSlideIndex = total > 0 ? Math.min(view.slideIndex, total - 1) : 0;
  const currentCatId = currentCat?.id ?? "";

  function syncTrackPosition(targetSlide: number, smooth: boolean) {
    isProgrammaticScrollRef.current = true;
    if (scrollResetTimerRef.current !== null) {
      window.clearTimeout(scrollResetTimerRef.current);
    }
    scrollResetTimerRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      scrollResetTimerRef.current = null;
    }, smooth ? 420 : 80);

    window.requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track || track.clientWidth <= 0) return;
      track.scrollTo({
        left: targetSlide * track.clientWidth,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  }

  function stepForward() {
    if (decks.length === 0 || total === 0) return;

    if (safeSlideIndex + 1 < total) {
      const nextSlide = safeSlideIndex + 1;
      setView((prev) => ({ ...prev, slideIndex: nextSlide }));
      syncTrackPosition(nextSlide, true);
      return;
    }

    // Category 6-product cycle completed: rotate its stage deck so every product gets a turn
    setView((prev) => {
      const active = prev.decks[prev.catIndex];
      if (!active) return prev;
      const rotated = dealStageBatch(active.all, active.rest, STAGE_SIZE);
      const updatedDecks = prev.decks.map((deck, idx) =>
        idx === prev.catIndex ? { ...deck, ...rotated } : deck
      );

      if (prev.catIndex + 1 < updatedDecks.length) {
        return { decks: updatedDecks, catIndex: prev.catIndex + 1, slideIndex: 0 };
      }
      return {
        decks: shuffleDecksWithoutImmediateRepeat(updatedDecks, active.id),
        catIndex: 0,
        slideIndex: 0,
      };
    });
    syncTrackPosition(0, false);
  }

  function stepBackward() {
    if (decks.length === 0 || total === 0) return;

    if (safeSlideIndex > 0) {
      const prevSlide = safeSlideIndex - 1;
      setView((prev) => ({ ...prev, slideIndex: prevSlide }));
      syncTrackPosition(prevSlide, true);
      return;
    }

    if (decks.length > 1) {
      const prevCatIdx = (safeCatIndex - 1 + decks.length) % decks.length;
      const prevLastSlide = Math.max(0, decks[prevCatIdx].stage.length - 1);
      setView((prev) => ({
        ...prev,
        catIndex: prevCatIdx,
        slideIndex: prevLastSlide,
      }));
      syncTrackPosition(prevLastSlide, false);
      return;
    }

    const lastSlide = total - 1;
    setView((prev) => ({ ...prev, slideIndex: lastSlide }));
    syncTrackPosition(lastSlide, true);
  }

  function selectCategory(targetCatIndex: number) {
    if (targetCatIndex === safeCatIndex) return;
    setView((prev) => ({ ...prev, catIndex: targetCatIndex, slideIndex: 0 }));
    syncTrackPosition(0, false);
  }

  function selectSlide(targetSlide: number) {
    if (total === 0) return;
    const bounded = Math.max(0, Math.min(total - 1, targetSlide));
    setView((prev) => ({ ...prev, slideIndex: bounded }));
    syncTrackPosition(bounded, true);
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
      setView((prev) => ({ ...prev, slideIndex: nextSlide }));
    }
  }

  // Center active category horizontally inside its hand-scrollable rail without scrolling the page
  useEffect(() => {
    const rail = catRailRef.current;
    const btn = catBtnRefs.current.get(currentCatId);
    if (!rail || !btn) return;
    const targetLeft =
      btn.offsetLeft - rail.clientWidth / 2 + btn.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [currentCatId]);

  const stepForwardRef = useRef(stepForward);
  useEffect(() => {
    stepForwardRef.current = stepForward;
  });

  useEffect(() => {
    if ((total <= 1 && decks.length <= 1) || isPaused) return;
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
  }, [isPaused, total, decks.length, safeCatIndex, safeSlideIndex]);

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

  const formattedIndex = String(safeSlideIndex + 1).padStart(2, "0");
  const formattedTotal = String(total).padStart(2, "0");
  const canStep = total > 1 || decks.length > 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Botanical formulations by category"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          stepForward();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          stepBackward();
        }
      }}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_16px_38px_-22px_rgba(20,34,27,0.18)]"
    >
      {/* Top Hand-Scrollable Category Rail */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
        <div
          ref={catRailRef}
          role="tablist"
          aria-label="Browse categories"
          className="flex min-w-0 flex-1 snap-x items-center gap-4 overflow-x-auto touch-pan-x scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {decks.map((cat, idx) => {
            const isActive = idx === safeCatIndex;
            return (
              <button
                key={cat.id}
                ref={(el) => {
                  if (el) catBtnRefs.current.set(cat.id, el);
                  else catBtnRefs.current.delete(cat.id);
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => selectCategory(idx)}
                className={cn(
                  "shrink-0 snap-start whitespace-nowrap border-b-2 pb-0.5 text-xs transition-colors focus-visible:outline-none",
                  isActive
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {formattedIndex} / {formattedTotal}
          </span>
          {canStep ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={stepBackward}
                aria-label="Previous product or category"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={stepForward}
                aria-label="Next product or category"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Swipeable Product Track (edge swipes step between categories) */}
      <div
        ref={trackRef}
        onScroll={handleTrackScroll}
        onTouchStart={(e) => {
          edgeSwipeRef.current = {
            x: e.touches[0]?.clientX ?? 0,
            startSlide: safeSlideIndex,
          };
        }}
        onTouchEnd={(e) => {
          const origin = edgeSwipeRef.current;
          edgeSwipeRef.current = null;
          if (!origin || !canStep) return;
          const deltaX = (e.changedTouches[0]?.clientX ?? origin.x) - origin.x;
          if (origin.startSlide === 0 && deltaX > 48) stepBackward();
          else if (origin.startSlide === total - 1 && deltaX < -48) stepForward();
        }}
        tabIndex={0}
        aria-label="Swipe horizontally through category products"
        className="flex w-full flex-1 snap-x snap-mandatory overflow-x-auto focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((product, index) => {
          const inventoryStatus = getInventoryStatus(product.stockQuantity);
          const statusLabel = getInventoryStatusLabel(inventoryStatus);
          const summaryText =
            product.benefits?.trim() || product.description.trim();

          return (
            <article
              key={`${currentCatId}-${product.id}`}
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
                    <span className="truncate font-medium text-muted-foreground">
                      {product.category?.name ?? currentCat.name}
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground/60">
                      ·
                    </span>
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
          aria-label="Select product in category"
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
