import { db } from "@/server/db/prisma";

export async function findAllCategories() {
  return db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function findCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: {
      slug,
    },
  });
}

type CreateCategoryData = {
  name: string;
  slug: string;
  description?: string;
  image?: string;
};

export async function createCategory(data: CreateCategoryData) {
  return db.category.create({
    data,
  });
}

type UpdateCategoryData = Partial<CreateCategoryData>;

export async function updateCategory(id: string, data: UpdateCategoryData) {
  return db.category.update({
    where: {
      id,
    },
    data,
  });
}

export async function deleteCategory(id: string) {
  return db.category.delete({
    where: {
      id,
    },
  });
}
