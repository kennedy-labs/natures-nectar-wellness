import {
  createProduct,
  getAllProducts,
  getAllProductsForAdmin,
} from "@/server/services/product.service";
import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiCreated, apiFail, apiOk, readJson } from "@/server/http/api-response";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const isAdminScope = url.searchParams.get("scope") === "admin";

    if (isAdminScope) {
      await requireAdminRequest(req);
    }

    const products = isAdminScope
      ? await getAllProductsForAdmin()
      : await getAllProducts();

    return apiOk(products);
  } catch (error) {
    return apiFail(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);

    const body = await readJson(req);
    const product = await createProduct(body);

    return apiCreated(product);
  } catch (error) {
    return apiFail(error);
  }
}
