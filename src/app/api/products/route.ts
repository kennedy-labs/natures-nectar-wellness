import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import {
  createProduct,
  getAllProducts,
  getAllProductsForAdmin,
  getPopularProducts,
  searchStorefrontProducts,
} from "@/server/services/product.service";
import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiCreated, apiFail, apiOk, readJson } from "@/server/http/api-response";
import { enforceRateLimit } from "@/server/http/rate-limit";

const productQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  popular: z.enum(["1", "true"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const isAdminScope = url.searchParams.get("scope") === "admin";

    if (isAdminScope) {
      await requireAdminRequest(req);
      const products = await getAllProductsForAdmin();
      return apiOk(products, {
        headers: { "Cache-Control": "private, no-cache, no-store" },
      });
    }

    const rawQ = url.searchParams.get("q") ?? undefined;
    const rawCategory = url.searchParams.get("category") ?? undefined;
    const rawPopular = url.searchParams.get("popular") ?? undefined;
    const rawLimit = url.searchParams.get("limit") ?? undefined;

    if (
      rawQ !== undefined ||
      rawCategory !== undefined ||
      rawPopular !== undefined ||
      rawLimit !== undefined
    ) {
      enforceRateLimit(req, {
        keyPrefix: "public-products-search",
        limit: 90,
        windowMs: 60_000,
      });

      const parsed = productQuerySchema.parse({
        q: rawQ || undefined,
        category: rawCategory || undefined,
        popular: rawPopular || undefined,
        limit: rawLimit || undefined,
      });

      if (parsed.popular && !parsed.q && !parsed.category) {
        const products = await getPopularProducts(parsed.limit ?? 5);
        return apiOk(products, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }

      const products = await searchStorefrontProducts({
        query: parsed.q,
        categorySlug: parsed.category,
        limit: parsed.limit,
      });

      return apiOk(products, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      });
    }

    const products = await getAllProducts();
    return apiOk(products, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
    const product = await createProduct(body);

    revalidateTag("products", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/categories");

    return apiCreated(product);
  } catch (error) {
    return apiFail(error);
  }
}
