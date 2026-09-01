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
  updateProduct as updateProductRecord,
} from "@/server/repositories/product.repository";

export async function getAllProducts() {
  return findAllProducts();
}

export async function getAllProductsForAdmin() {
  return findAllProductsForAdmin();
}

export async function getProductsByCategorySlug(slug: string) {
  return findActiveProductsByCategorySlug(slug);
}

export async function getProductBySlug(slug: string) {
  return findActiveProductBySlug(slug);
}

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
