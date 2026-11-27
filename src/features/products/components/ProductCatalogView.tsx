"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Product } from "@/features/products/types/product.types";
import { ProductGrid } from "@/features/products/components/ProductGrid";

type ProductCatalogViewProps = {
  products: Product[];
  categories?: Array<{ id: string; name: string; slug: string }>;
};

export function ProductCatalogView({
  products,
  categories = [],
}: ProductCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name">("featured");

  // Derive unique categories from products if not provided
  const categoryOptions = useMemo(() => {
    if (categories.length > 0) return categories;
    const map = new Map<string, { id: string; name: string; slug: string }>();
    for (const p of products) {
      if (p.category) {
        map.set(p.category.slug, {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
        });
      }
    }
    return Array.from(map.values());
  }, [categories, products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchBenefits = product.benefits?.toLowerCase().includes(q) ?? false;
          const matchIngredients = product.ingredients?.toLowerCase().includes(q) ?? false;
          if (!matchName && !matchDesc && !matchBenefits && !matchIngredients) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "all") {
          const categorySlug = product.category?.slug ?? product.categoryId;
          if (categorySlug !== selectedCategory) {
            return false;
          }
        }

        // In-stock filter
        if (inStockOnly && product.stockQuantity <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        // Featured default: featured first, then newest
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || inStockOnly;

  return (
    <div className="space-y-6">
      {/* Search & Sort Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_3px_rgba(24,42,32,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remedies, teas, honey, shilajit, herbs..."
            className="h-10 pl-9 pr-9"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span>In stock only</span>
          </label>

          <div className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "featured"
                    | "price-asc"
                    | "price-desc"
                    | "name"
                )
              }
              className="bg-transparent font-medium text-foreground focus:outline-none"
            >
              <option value="featured">Featured first</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categoryOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            All Remedies ({products.length})
          </button>
          {categoryOptions.map((cat) => {
            const count = products.filter(
              (p) => p.category?.slug === cat.slug || p.categoryId === cat.id
            ).length;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat.name} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{filteredProducts.length}</strong>{" "}
          {filteredProducts.length === 1 ? "remedy" : "remedies"}
        </span>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setInStockOnly(false);
              setSortBy("featured");
            }}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset filters
          </Button>
        ) : null}
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <p className="font-display text-lg font-medium text-foreground">
            No matching botanicals found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search terms or clearing the selected category filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setInStockOnly(false);
            }}
            className="mt-4"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
