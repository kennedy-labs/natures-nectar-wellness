import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3).optional(),
  image: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
