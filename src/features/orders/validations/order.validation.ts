import { z } from "zod";

import {
  UNIFIED_ORDER_STAGES,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const submitOrderSchema = z
  .object({
    customer: z.object({
      name: z.string().min(2),
      phone: z.string().min(7),
      email: z.string().email().optional(),
    }),
    delivery: z.object({
      method: z.enum(["PICKUP", "LOCAL_DELIVERY", "COUNTRYWIDE_DELIVERY"]),
      location: z.string().min(3).optional(),
      notes: z.string().min(3).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    }),
    items: z.array(orderItemInputSchema).min(1),
    preferredPaymentMethod: z
      .enum([
        "MPESA_BUY_GOODS",
        "BANK_TRANSFER",
        "CASH_ON_PICKUP",
        "CASH_ON_DELIVERY",
      ]),
    customerNotes: z.string().min(3).optional(),
  })
  .superRefine((data, context) => {
    if (data.delivery.method !== "PICKUP" && !data.delivery.location) {
      context.addIssue({
        code: "custom",
        path: ["delivery", "location"],
        message: "Delivery location is required unless pickup is selected.",
      });
    }
  });

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

export const ORDER_STATUSES = UNIFIED_ORDER_STAGES;

export type OrderStatus = UnifiedOrderStage;