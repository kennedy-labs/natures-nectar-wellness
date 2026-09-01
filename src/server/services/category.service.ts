import {
  createCategorySchema,
  updateCategorySchema,
} from "@/features/categories/validations/category.validation";
import { createCategorySlug } from "@/features/categories/utils/category.utils";
import {
  createCategory as createCategoryRecord,
  deleteCategory as deleteCategoryRecord,
  findAllCategories,
  findCategoryBySlug,
  updateCategory as updateCategoryRecord,
} from "@/server/repositories/category.repository";

export async function getAllCategories() {
  return findAllCategories();
}

export async function getCategoryBySlug(slug: string) {
  return findCategoryBySlug(slug);
}

export async function createCategory(input: unknown) {
  const data = createCategorySchema.parse(input);

  return createCategoryRecord({
    name: data.name,
    slug: createCategorySlug(data.name),
    description: data.description,
    image: data.image,
  });
}

export async function updateCategory(id: string, input: unknown) {
  const data = updateCategorySchema.parse(input);

  return updateCategoryRecord(id, {
    name: data.name,
    slug: data.name ? createCategorySlug(data.name) : undefined,
    description: data.description,
    image: data.image,
  });
}

export async function deleteCategory(id: string) {
  return deleteCategoryRecord(id);
}
