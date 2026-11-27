import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  createCategorySchema,
  updateCategorySchema,
} from "@/features/categories/validations/category.validation";
import { createCategorySlug } from "@/features/categories/utils/category.utils";
import { ApiError } from "@/server/http/api-error";
import {
  createCategory as createCategoryRecord,
  deleteCategory as deleteCategoryRecord,
  findAllCategories,
  findCategoryBySlug,
  findStorefrontCategories,
  updateCategory as updateCategoryRecord,
} from "@/server/repositories/category.repository";

const getCachedStorefrontCategories = unstable_cache(
  async () => findStorefrontCategories(),
  ["storefront-categories"],
  { revalidate: 60, tags: ["categories"] }
);

const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => findCategoryBySlug(slug),
  ["storefront-category-by-slug"],
  { revalidate: 60, tags: ["categories"] }
);

export async function getAllCategories() {
  return findAllCategories();
}

export const getStorefrontCategories = cache(async () =>
  getCachedStorefrontCategories()
);

export const getCategoryBySlug = cache(async (slug: string) =>
  getCachedCategoryBySlug(slug)
);

export async function createCategory(input: unknown) {
  const data = createCategorySchema.parse(input);

  if (data.image?.startsWith("/api/media/")) {
    throw new ApiError(
      400,
      "INVALID_IMAGE",
      "Upload a new photo or provide a direct image URL."
    );
  }

  return createCategoryRecord({
    name: data.name,
    slug: createCategorySlug(data.name),
    description: data.description,
    image: data.image,
  });
}

export async function updateCategory(id: string, input: unknown) {
  const data = updateCategorySchema.parse(input);
  const safeImage = data.image?.startsWith("/api/media/")
    ? undefined
    : data.image;

  return updateCategoryRecord(id, {
    name: data.name,
    slug: data.name ? createCategorySlug(data.name) : undefined,
    description: data.description,
    image: safeImage,
  });
}

export async function deleteCategory(id: string) {
  return deleteCategoryRecord(id);
}
