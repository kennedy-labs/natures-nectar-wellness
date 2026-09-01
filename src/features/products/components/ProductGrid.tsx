import Link from "next/link";

import { Product } from "@/features/products/types/product.types";
import { ProductCard } from "@/features/products/components/ProductCard";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="block transition-transform hover:-translate-y-0.5"
        >
          <ProductCard
            id={product.id}
            slug={product.slug}
            name={product.name}
            description={product.description}
            benefits={product.benefits}
            price={product.price}
            stockQuantity={product.stockQuantity}
            image={product.image}
          />
        </Link>
      ))}
    </div>
  );
}