import { Product } from "@/features/products/types/product.types";
import { ProductCard } from "@/features/products/components/ProductCard";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          id={product.id}
          slug={product.slug}
          name={product.name}
          description={product.description}
          benefits={product.benefits}
          price={product.price}
          stockQuantity={product.stockQuantity}
          image={product.image}
          categoryName={product.category?.name}
          isFeatured={product.isFeatured}
          priority={index < 4}
        />
      ))}
    </div>
  );
}