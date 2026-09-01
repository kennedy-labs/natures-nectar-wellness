import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/server/auth/admin-auth";
import { getAdminDashboard } from "@/features/admin-v2/services/admin-dashboard.service";
import { getApiErrorResponse } from "@/server/http/api-error";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);

    const dashboard = await getAdminDashboard();

    return NextResponse.json({
      ok: true,
      data: dashboard,
    });
  } catch (error) {
    const response = getApiErrorResponse(error);

    return NextResponse.json(response.body, {
      status: response.status,
    });
  }
}