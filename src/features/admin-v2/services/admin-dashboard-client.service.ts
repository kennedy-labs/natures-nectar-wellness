import { readApiData } from "@/lib/api-client";

import type { AdminDashboardData } from "../types/dashboard.types";

export async function getDashboard() {
  const response = await fetch("/api/admin2/dashboard");

  return readApiData<AdminDashboardData>(response);
}