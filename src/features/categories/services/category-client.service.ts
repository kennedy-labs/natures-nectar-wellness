import {
  fetchCategories,
  patchCategory,
  postCategory,
  removeCategory,
} from "@/features/categories/api/category-api";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/features/categories/validations/category.validation";

export function getCategoriesForClient() {
  return fetchCategories();
}

export function createCategoryFromClient(input: CreateCategoryInput) {
  return postCategory(input);
}

export function updateCategoryFromClient(
  id: string,
  input: UpdateCategoryInput
) {
  return patchCategory(id, input);
}

export function deleteCategoryFromClient(id: string) {
  return removeCategory(id);
}
