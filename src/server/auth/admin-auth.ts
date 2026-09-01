import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth/auth";
import { db } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";

async function getAdminSession(requestHeaders: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return {
    session,
    user,
  };
}

export async function requireAdminRequest(request: Request) {
  const adminSession = await getAdminSession(request.headers);

  if (!adminSession) {
    throw new ApiError(
      401,
      "ADMIN_AUTH_REQUIRED",
      "Admin authentication is required."
    );
  }

  return adminSession;
}

export async function requireAdminPage() {
  const adminSession = await getAdminSession(await headers());

  if (!adminSession) {
    redirect("/admin/login");
  }

  return adminSession;
}
