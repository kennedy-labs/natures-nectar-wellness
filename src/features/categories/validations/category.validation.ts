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

export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3).optional(),
  image: imageValueSchema,
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
