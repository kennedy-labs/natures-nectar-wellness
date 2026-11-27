import { toStorefrontMediaUrl } from "@/lib/media";
import { db } from "@/server/db/prisma";

function mapCategoryMedia<
  T extends {
    id: string;
    image: string | null;
    updatedAt: Date;
  },
>(category: T): T {
  return {
    ...category,
    image: toStorefrontMediaUrl(
      "categories",
      category.id,
      category.image,
      category.updatedAt
    ),
  };
}

export async function findAllCategories() {
  return db.$queryRaw<
    Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >`
    SELECT
      "id",
      "name",
      "slug",
      "description",
      CASE
        WHEN "image" LIKE 'data:%' THEN CONCAT('/api/media/categories/', "id", '?v=', FLOOR(EXTRACT(EPOCH FROM ("updatedAt" AT TIME ZONE 'UTC')) * 1000)::bigint::text)
        ELSE "image"
      END AS "image",
      "createdAt",
      "updatedAt"
    FROM "Category"
    ORDER BY "name" ASC
  `;
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
  const created = await db.category.create({
    data,
  });

  return mapCategoryMedia(created);
}

type UpdateCategoryData = Partial<Omit<CreateCategoryData, "image">> & {
  image?: string | null;
};

export async function updateCategory(id: string, data: UpdateCategoryData) {
  const updated = await db.category.update({
    where: {
      id,
    },
    data,
  });

  return mapCategoryMedia(updated);
}

export async function deleteCategory(id: string) {
  return db.category.delete({
    where: {
      id,
    },
  });
}
