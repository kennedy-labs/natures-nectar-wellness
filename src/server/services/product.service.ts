import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  createProductSchema,
  updateProductSchema,
} from "@/features/products/validations/product.validation";
import { createProductSlug } from "@/features/products/utils/product.utils";
import {
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  findAllProducts,
  findAllProductsForAdmin,
  findActiveProductsByCategorySlug,
  findActiveProductBySlug,
  findFeaturedProducts,
  updateProduct as updateProductRecord,
} from "@/server/repositories/product.repository";

const getCachedAllProducts = unstable_cache(
  async () => findAllProducts(),
  ["storefront-all-products"],
  { revalidate: 60, tags: ["products"] }
);

const getCachedFeaturedProducts = unstable_cache(
  async () => findFeaturedProducts(),
  ["storefront-featured-products"],
  { revalidate: 60, tags: ["products"] }
);

const getCachedProductsByCategorySlug = unstable_cache(
  async (slug: string) => findActiveProductsByCategorySlug(slug),
  ["storefront-category-products"],
  { revalidate: 60, tags: ["products", "categories"] }
);

const getCachedProductBySlug = unstable_cache(
  async (slug: string) => findActiveProductBySlug(slug),
  ["storefront-product-by-slug"],
  { revalidate: 60, tags: ["products"] }
);

export const getAllProducts = cache(async () => getCachedAllProducts());

export const getFeaturedProducts = cache(async () =>
  getCachedFeaturedProducts()
);

export async function getAllProductsForAdmin() {
  return findAllProductsForAdmin();
}

export const getProductsByCategorySlug = cache(async (slug: string) =>
  getCachedProductsByCategorySlug(slug)
);

export const getProductBySlug = cache(async (slug: string) =>
  getCachedProductBySlug(slug)
);

export async function createProduct(input: unknown) {
  const data = createProductSchema.parse(input);

  return createProductRecord({
    name: data.name,
    description: data.description,
    benefits: data.benefits,
    usageInstructions: data.usageInstructions,
    ingredients: data.ingredients,
    price: data.price,
    stockQuantity: data.stockQuantity,
    image: data.image,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
    categoryId: data.categoryId,
    slug: createProductSlug(data.name),
  });
}

export async function updateProduct(id: string, input: unknown) {
  const data = updateProductSchema.parse(input);

  return updateProductRecord(id, {
    name: data.name,
    description: data.description,
    benefits: data.benefits,
    usageInstructions: data.usageInstructions,
    ingredients: data.ingredients,
    price: data.price,
    stockQuantity: data.stockQuantity,
    image: data.image,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
    categoryId: data.categoryId,
    slug: data.name ? createProductSlug(data.name) : undefined,
  });
}

export async function deleteProduct(id: string) {
  return deleteProductRecord(id);
}
