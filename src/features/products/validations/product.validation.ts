import { z } from "zod";

const imageValueSchema = z
  .string()
  .trim()
  .refine(
    (val) =>
      val.startsWith("/") ||
      val.startsWith("https://") ||
      val.startsWith("http://") ||
      val.startsWith("data:image/"),
    "Must be a valid image URL, uploaded photo, or /images/ path"
  )
  .optional();

export const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  benefits: z.string().min(3).optional(),
  usageInstructions: z.string().min(3).optional(),
  ingredients: z.string().min(3).optional(),
  price: z.number().positive(),
  stockQuantity: z.number().min(0),
  image: imageValueSchema,
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().min(1),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    benefits: z.string().min(3).optional(),
    usageInstructions: z.string().min(3).optional(),
    ingredients: z.string().min(3).optional(),
    price: z.number().positive().optional(),

    stockQuantity: z
      .number()
      .int()
      .min(0, "Stock cannot be negative")
      .max(1000000, "Stock value too large")
      .optional(),

    image: imageValueSchema.nullable(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().min(1).optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;