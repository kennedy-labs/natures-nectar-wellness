import { InventoryStatus } from "@/features/inventory/types/inventory.types";

const LOW_STOCK_THRESHOLD = 5;

export function getInventoryStatus(stockQuantity: number): InventoryStatus {
  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return "LOW_STOCK";
  }

  return "IN_STOCK";
}

export function getInventoryStatusLabel(status: InventoryStatus) {
  switch (status) {
    case "IN_STOCK":
      return "In stock";
    case "LOW_STOCK":
      return "Low stock";
    case "OUT_OF_STOCK":
      return "Out of stock";
  }
}
