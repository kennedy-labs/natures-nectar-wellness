"use client";

import { useQuery } from "@tanstack/react-query";

import { getProductsForClient } from "@/features/products/services/product-client.service";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProductsForClient,
  });
}
