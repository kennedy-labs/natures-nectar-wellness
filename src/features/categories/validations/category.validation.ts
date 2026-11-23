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

export const createCategorySchema = z.object({
  name: z
    .string("Category name is required.")
    .trim()
    .min(2, "Category name must be at least 2 characters."),
  description: z
    .string()
    .trim()
    .min(3, "Category description must be at least 3 characters if provided.")
    .optional(),
  image: imageValueSchema,
});

export const updateCategorySchema = createCategorySchema
  .extend({
    image: imageValueSchema.nullable(),
  })
  .partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
