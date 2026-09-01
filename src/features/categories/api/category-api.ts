import { Category } from "@/features/categories/types/category.types";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/features/categories/validations/category.validation";
import { readApiData } from "@/lib/api-client";

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories");

  return readApiData<Category[]>(response);
}

export async function postCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiData<Category>(response);
}

export async function patchCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiData<Category>(response);
}

export async function removeCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  return readApiData<Category>(response);
}
