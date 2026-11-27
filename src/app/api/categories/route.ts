import { revalidatePath, revalidateTag } from "next/cache";

import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiCreated, apiFail, apiOk, readJson } from "@/server/http/api-response";
import {
  createCategory,
  getStorefrontCategories,
} from "@/server/services/category.service";

export async function GET() {
  try {
    const categories = await getStorefrontCategories();

    return apiOk(categories, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    return apiFail(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);

    const body = await readJson(req);
    const category = await createCategory(body);

    revalidateTag("categories", { expire: 0 });
    revalidateTag("products", { expire: 0 });
    revalidatePath("/categories");
    revalidatePath("/products");

    return apiCreated(category);
  } catch (error) {
    return apiFail(error);
  }
}
