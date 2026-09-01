import {
  fetchAdminProducts,
  fetchProducts,
  patchProduct,
  postProduct,
  removeProduct,
} from "@/features/products/api/product-api";
import {
  CreateProductInput,
  UpdateProductInput,
} from "@/features/products/validations/product.validation";

export function getProductsForClient() {
  return fetchProducts();
}

export function getAdminProductsForClient() {
  return fetchAdminProducts();
}

export function createProductFromClient(input: CreateProductInput) {
  return postProduct(input);
}

export function updateProductFromClient(id: string, input: UpdateProductInput) {
  return patchProduct(id, input);
}

export function deleteProductFromClient(id: string) {
  return removeProduct(id);
}
