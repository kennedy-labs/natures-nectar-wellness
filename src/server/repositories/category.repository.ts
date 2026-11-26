import { toStorefrontMediaUrl } from "@/lib/media";
import { db } from "@/server/db/prisma";

export async function findAllCategories() {
  return db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function findStorefrontCategories() {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
    image: toStorefrontMediaUrl(
      "categories",
      category.id,
      category.image,
      category.updatedAt
    ),
  }));
}

export async function findCategoryBySlug(slug: string) {
  const category = await db.category.findUnique({
    where: {
      slug,
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!category) return null;

  const { _count, ...rest } = category;

  return {
    ...rest,
    productCount: _count.products,
    image: toStorefrontMediaUrl(
      "categories",
      category.id,
      category.image,
      category.updatedAt
    ),
  };
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

type UpdateCategoryData = Partial<Omit<CreateCategoryData, "image">> & {
  image?: string | null;
};

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
