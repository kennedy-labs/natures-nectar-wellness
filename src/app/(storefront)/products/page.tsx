import type { Metadata } from "next";

import { ProductGrid } from "@/features/products/components/ProductGrid";
import { getAllProducts } from "@/server/services/product.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products | Nature's Nectar Wellness",
  description: "Browse herbal products, teas, supplements, and natural wellness items.",
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Explore our wellness catalog. Stock availability is shown on each product.
        </p>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          No products available yet. Please check back soon.
        </p>
      )}
    </section>
  );
}
