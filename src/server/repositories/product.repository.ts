import { toStorefrontMediaUrl } from "@/lib/media";
import { db } from "@/server/db/prisma";

function mapStorefrontProduct<
  T extends {
    id: string;
    image: string | null;
    updatedAt: Date;
    category?: {
      id: string;
      image: string | null;
      updatedAt: Date;
    } | null;
  },
>(product: T): T {
  return {
    ...product,
    image: toStorefrontMediaUrl(
      "products",
      product.id,
      product.image,
      product.updatedAt
    ),
    ...(product.category
      ? {
          category: {
            ...product.category,
            image: toStorefrontMediaUrl(
              "categories",
              product.category.id,
              product.category.image,
              product.category.updatedAt
            ),
          },
        }
      : {}),
  };
}

export async function findAllProducts() {
  const products = await db.product.findMany({
    include: {
      category: true,
    },
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products.map(mapStorefrontProduct);
}

export async function findFeaturedProducts() {
  const products = await db.product.findMany({
    include: {
      category: true,
    },
    where: {
      isActive: true,
      isFeatured: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  return products.map(mapStorefrontProduct);
}

export async function findAllProductsForAdmin() {
  return db.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function findActiveProductsByCategorySlug(categorySlug: string) {
  const products = await db.product.findMany({
    include: {
      category: true,
    },
    where: {
      isActive: true,
      category: {
        slug: categorySlug,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return products.map(mapStorefrontProduct);
}

export async function findProductBySlug(slug: string) {
  return db.product.findUnique({
    include: {
      category: true,
    },
    where: {
      slug,
    },
  });
}

export async function findActiveProductBySlug(slug: string) {
  const product = await db.product.findFirst({
    include: {
      category: true,
    },
    where: {
      slug,
      isActive: true,
    },
  });

  return product ? mapStorefrontProduct(product) : null;
}

export async function findActiveProductsByIds(ids: string[]) {
  return db.product.findMany({
    where: {
      id: {
        in: ids,
      },
      isActive: true,
    },
  });
}

type CreateProductData = {
  name: string;
  slug: string;
  description: string;
  benefits?: string;
  usageInstructions?: string;
  ingredients?: string;
  price: number;
  stockQuantity: number;
  image?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryId: string;
};

export async function createProduct(data: CreateProductData) {
  return db.product.create({
    include: {
      category: true,
    },
    data,
  });
}

type UpdateProductData = Partial<CreateProductData>;

export async function updateProduct(id: string, data: UpdateProductData) {
  return db.product.update({
    where: {
      id,
    },
    include: {
      category: true,
    },
    data,
  });
}

export async function deleteProduct(id: string) {
  return db.product.update({
    where: {
      id,
    },
    include: {
      category: true,
    },
    data: {
      isActive: false,
    },
  });
}

export async function decrementProductStock(productId: string, quantity: number) {
  return db.product.update({
    where: { id: productId },
    data: {
      stockQuantity: {
        decrement: quantity,
      },
    },
  });
}