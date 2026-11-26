"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, Loader2, Search, X } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type SearchApiResponse = {
  ok?: boolean;
  data?: Product[];
};

type InlineBotanicalSearchProps = {
  variant?: "hero" | "subbar";
  initialQuery?: string;
  placeholder?: string;
  className?: string;
};

export function InlineBotanicalSearch({
  variant = "subbar",
  initialQuery = "",
  placeholder = "Search raw honey, shilajit, hibiscus tea...",
  className,
}: InlineBotanicalSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [popularPicks, setPopularPicks] = useState<Product[] | null>(null);
  const [typedResults, setTypedResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "/") return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (isTypingTarget) return;

      event.preventDefault();
      inputRef.current?.focus();
      setOpen(true);
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (!trimmed && popularPicks !== null) {
      return;
    }

    const controller = new AbortController();
    const delay = trimmed ? 180 : 0;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({ limit: "5" });
        if (trimmed) {
          searchParams.set("q", trimmed);
        } else {
          searchParams.set("popular", "1");
        }

        const response = await fetch(`/api/products?${searchParams.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as SearchApiResponse;
        const items = Array.isArray(payload.data) ? payload.data.slice(0, 5) : [];

        if (trimmed) {
          setTypedResults(items);
        } else {
          setPopularPicks(items);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Unable to load suggestions right now. Press Enter to search.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, popularPicks]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setOpen(false);
    inputRef.current?.blur();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  const trimmedQuery = query.trim();
  const visibleItems = trimmedQuery ? typedResults : popularPicks ?? [];
  const activeError = !trimmedQuery && popularPicks !== null ? null : error;
  const activeLoading = !trimmedQuery && popularPicks !== null ? false : loading;
  const catalogHref = trimmedQuery
    ? `/products?q=${encodeURIComponent(trimmedQuery)}`
    : "/products";
  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search botanical products"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/85 bg-card transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20",
          isHero ? "h-11 px-3.5" : "h-10 px-3"
        )}
      >
        <Search
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-foreground"
        />

        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setError(null);
            if (!open) setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Search herbal formulations"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/85 focus:outline-none"
        />

        {activeLoading ? (
          <Loader2
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground"
          />
        ) : null}

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setError(null);
              setOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}

        <button
          type="submit"
          aria-label="Submit search"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors",
            isHero
              ? "h-8 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
              : "h-7 px-2 text-xs text-primary hover:bg-muted"
          )}
        >
          <span>Search</span>
        </button>
      </form>

      {open ? (
        <div
          role="region"
          aria-label={trimmedQuery ? "Search suggestions" : "Popular formulations"}
          className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-border/85 bg-background shadow-md"
        >
          <div className="border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground">
            {trimmedQuery
              ? `Matches for "${trimmedQuery}"`
              : "Popular picks"}
          </div>

          {activeError ? (
            <p className="px-3.5 py-4 text-xs text-muted-foreground">{activeError}</p>
          ) : activeLoading && visibleItems.length === 0 ? (
            <div className="space-y-1 p-2">
              {[0, 1, 2].map((slot) => (
                <div
                  key={slot}
                  className="flex items-center gap-3 rounded-md px-2 py-2"
                >
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-md bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <ul className="divide-y divide-border/50">
              {visibleItems.map((product) => {
                const status = getInventoryStatus(product.stockQuantity);
                const statusLabel = getInventoryStatusLabel(status);

                return (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-card"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted/40">
                        {product.image ? (
                          <SkeletonImage
                            src={product.image}
                            alt={product.name}
                            useNextImage={!product.image.startsWith("data:")}
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary/70">
                            <Leaf className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-muted-foreground">
                          {product.category?.name ? (
                            <>
                              <span>{product.category.name}</span>
                              <span className="mx-1" aria-hidden="true">
                                ·
                              </span>
                            </>
                          ) : null}
                          <span
                            className={cn(
                              "font-medium",
                              status === "OUT_OF_STOCK"
                                ? "text-destructive"
                                : status === "LOW_STOCK"
                                  ? "text-amber-700"
                                  : "text-primary"
                            )}
                          >
                            {statusLabel}
                          </span>
                        </p>
                        <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {product.name}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {formatKes(product.price)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-3.5 py-4 text-xs text-muted-foreground">
              No matching formulations found.{" "}
              <Link
                href="/categories"
                onClick={() => setOpen(false)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Browse categories
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 bg-muted/35 px-3 py-2 text-xs">
            <Link
              href={catalogHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
            >
              <span>
                {trimmedQuery
                  ? `See all results for "${trimmedQuery}"`
                  : "Browse all formulations"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
