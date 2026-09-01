import { requireAdminRequest } from "@/server/auth/admin-auth";
import { apiFail, apiOk, readJson } from "@/server/http/api-response";
import {
  deleteCategory,
  updateCategory,
} from "@/server/services/category.service";

export async function PATCH(
  req: Request,
  context: RouteContext<"/api/categories/[id]">
) {
  try {
    await requireAdminRequest(req);

    const { id } = await context.params;
    const body = await readJson(req);
    const category = await updateCategory(id, body);

    return apiOk(category);
  } catch (error) {
    return apiFail(error);
  }
}

export async function DELETE(
  req: Request,
  context: RouteContext<"/api/categories/[id]">
) {
  try {
    await requireAdminRequest(req);

    const { id } = await context.params;
    const category = await deleteCategory(id);

    return apiOk(category);
  } catch (error) {
    return apiFail(error);
  }
}
