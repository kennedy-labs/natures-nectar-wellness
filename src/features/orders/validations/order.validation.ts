import { z } from "zod";

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

/**
 * ORDER STATUS TYPES (FINALIZED)
 * REFUNDED added
 */
export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];