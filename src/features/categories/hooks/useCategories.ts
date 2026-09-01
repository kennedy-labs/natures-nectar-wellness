"use client";

import { useQuery } from "@tanstack/react-query";

import { getCategoriesForClient } from "@/features/categories/services/category-client.service";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategoriesForClient,
  });
}
