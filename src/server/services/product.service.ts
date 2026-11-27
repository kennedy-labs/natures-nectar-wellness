import { unstable_cache } from "next/cache";
import { cache } from "react";

import { Prisma } from "@prisma/client";

import {
  createProductSchema,
  updateProductSchema,
} from "@/features/products/validations/product.validation";
import { createProductSlug } from "@/features/products/utils/product.utils";
import { ApiError } from "@/server/http/api-error";
import {
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  findAllProducts,
  findAllProductsForAdmin,
  findActiveProductsByCategorySlug,
  findActiveProductBySlug,
  findFeaturedProducts,
  findPopularProducts,
  permanentlyDeleteProduct as permanentlyDeleteProductRecord,
  searchActiveProducts,
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

const getCachedPopularProducts = unstable_cache(
  async (limit: number) => findPopularProducts(limit),
  ["storefront-popular-products"],
  { revalidate: 60, tags: ["products", "orders"] }
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

export const getPopularProducts = cache(async (limit = 6) =>
  getCachedPopularProducts(limit)
);

export async function searchStorefrontProducts(params: {
  query?: string;
  categorySlug?: string;
  limit?: number;
}) {
  const query = params.query?.trim().slice(0, 80) || undefined;
  const categorySlug = params.categorySlug?.trim().slice(0, 80) || undefined;

  if (!query && !categorySlug && !params.limit) {
    return getAllProducts();
  }

  return searchActiveProducts({
    query,
    categorySlug,
    limit: params.limit,
  });
}

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

export async function permanentlyDeleteProduct(id: string) {
  try {
    const deleted = await permanentlyDeleteProductRecord(id);
    if (!deleted) {
      throw new ApiError(
        404,
        "NOT_FOUND",
        "That product no longer exists."
      );
    }
    return deleted;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (
      (error instanceof Error && error.message === "PRODUCT_HAS_ORDERS") ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003")
    ) {
      throw new ApiError(
        409,
        "PRODUCT_HAS_ORDERS",
        "This product is linked to existing customer orders and cannot be permanently erased. Archive it instead to hide it from the storefront."
      );
    }
    throw error;
  }
}
