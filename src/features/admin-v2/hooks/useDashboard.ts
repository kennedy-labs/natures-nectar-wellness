import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "../services/admin-dashboard-client.service";

export function useDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboard,
  });
}