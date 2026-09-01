import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiCreated, apiFail, apiOk, readJson } from "@/server/http/api-response";
import {
  createCategory,
  getAllCategories,
} from "@/server/services/category.service";

export async function GET() {
  try {
    const categories = await getAllCategories();

    return apiOk(categories);
  } catch (error) {
    return apiFail(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);

    const body = await readJson(req);
    const category = await createCategory(body);

    return apiCreated(category);
  } catch (error) {
    return apiFail(error);
  }
}
