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
    "Image must be an uploaded photo, an https:// URL, or a /images/ path."
  )
  .optional();

export const createProductSchema = z.object({
  name: z
    .string("Product name is required.")
    .trim()
    .min(3, "Product name must be at least 3 characters."),
  description: z
    .string("Description is required.")
    .trim()
    .min(5, "Description must be at least 5 characters."),
  benefits: z
    .string()
    .trim()
    .min(2, "Wellness benefits must be at least 2 characters if provided.")
    .optional(),
  usageInstructions: z
    .string()
    .trim()
    .min(2, "Usage instructions must be at least 2 characters if provided.")
    .optional(),
  ingredients: z
    .string()
    .trim()
    .min(2, "Ingredients must be at least 2 characters if provided.")
    .optional(),
  price: z
    .number("Price must be a valid number.")
    .positive("Price must be greater than KES 0."),
  stockQuantity: z
    .number("Stock quantity must be a valid number.")
    .int("Stock quantity must be a whole number.")
    .min(0, "Stock quantity cannot be negative.")
    .max(1000000, "Stock quantity cannot exceed 1,000,000."),
  image: imageValueSchema,
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string("Please select a category.").min(1, "Please select a category."),
});

export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Product name must be at least 3 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, "Description must be at least 5 characters.")
      .optional(),
    benefits: z
      .string()
      .trim()
      .min(2, "Wellness benefits must be at least 2 characters if provided.")
      .optional(),
    usageInstructions: z
      .string()
      .trim()
      .min(2, "Usage instructions must be at least 2 characters if provided.")
      .optional(),
    ingredients: z
      .string()
      .trim()
      .min(2, "Ingredients must be at least 2 characters if provided.")
      .optional(),
    price: z
      .number("Price must be a valid number.")
      .positive("Price must be greater than KES 0.")
      .optional(),

    stockQuantity: z
      .number("Stock quantity must be a valid number.")
      .int("Stock quantity must be a whole number.")
      .min(0, "Stock quantity cannot be negative.")
      .max(1000000, "Stock quantity cannot exceed 1,000,000.")
      .optional(),

    image: imageValueSchema.nullable(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    categoryId: z.string().min(1, "Please select a category.").optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;