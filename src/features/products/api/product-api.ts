import { Product } from "@/features/products/types/product.types";
import {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/products/validations/product.validation";
import { readApiData } from "@/lib/api-client";

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");

  return readApiData<Product[]>(response);
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const response = await fetch("/api/products?scope=admin");

  return readApiData<Product[]>(response);
}

export async function postProduct(input: CreateProductInput): Promise<Product> {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiData<Product>(response);
}

export async function patchProduct(
  id: string,
  input: UpdateProductInput
): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiData<Product>(response);
}

export async function removeProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });

  return readApiData<Product>(response);
}
