import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import {
  deleteProduct,
  permanentlyDeleteProduct,
  updateProduct,
} from "@/server/services/product.service";

export async function PATCH(
  req: Request,
  context: RouteContext<"/api/products/[id]">
) {
  try {
    await requireAdminRequest(req);

    const { id } = await context.params;
    const body = await readJson(req);
    const product = await updateProduct(id, body);

    revalidateTag("products", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`);
    }

    return apiOk(product);
  } catch (error) {
    return apiFail(error);
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext<"/api/products/[id]">
) {
  try {
    await requireAdminRequest(req);

    const { id } = await context.params;
    const permanent = new URL(req.url).searchParams.get("permanent") === "true";

    const result = permanent
      ? await permanentlyDeleteProduct(id)
      : await deleteProduct(id);

    revalidateTag("products", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");
    if (result?.slug) {
      revalidatePath(`/products/${result.slug}`);
    }

    return apiOk(result);
  } catch (error) {
    return apiFail(error);
  }
}
