"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw } from "lucide-react";

import { Product } from "@/features/products/types/product.types";
import { Category } from "@/features/categories/types/category.types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { Button } from "@/components/ui/button";

type CatalogViewProps = {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
};

export function CatalogView({
  products,
  categories,
  initialCategory,
}: CatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategorySlug = searchParams.get("category") || initialCategory || "all";
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleCategoryChange = (slug: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === "all") {
        params.delete("category");
      } else {
        params.set("category", slug);
      }
      const query = params.toString();
      router.push(`/products${query ? `?${query}` : ""}`, { scroll: false });
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    handleCategoryChange("all");
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (currentCategorySlug !== "all") {
        if (product.category?.slug !== currentCategorySlug) {
          return false;
        }
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCategory = product.category?.name.toLowerCase().includes(query);
        const matchesBenefits = product.benefits?.toLowerCase().includes(query);

        if (!matchesName && !matchesDesc && !matchesCategory && !matchesBenefits) {
          return false;
        }
      }

      return true;
    });
  }, [products, currentCategorySlug, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search herbal products..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Product Count */}
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of {products.length} formulations
        </p>
      </div>

      {/* Category Filter Pills (Functional Filter Buttons) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 pb-4">
        <button
          onClick={() => handleCategoryChange("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            currentCategorySlug === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
          }`}
          type="button"
        >
          All Collections
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              currentCategorySlug === cat.slug
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
            type="button"
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-foreground">
            No botanical formulations found
          </p>
          <p className="max-w-md text-xs sm:text-sm text-muted-foreground">
            We couldn&apos;t find any remedies matching &ldquo;{searchQuery || currentCategorySlug}&rdquo;. Try resetting your filters to explore our full apothecary.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="gap-2 mt-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
