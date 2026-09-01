import { db } from "@/server/db/prisma";

export async function findAllProducts() {
  return db.product.findMany({
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
  return db.product.findMany({
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
  return db.product.findFirst({
    include: {
      category: true,
    },
    where: {
      slug,
      isActive: true,
    },
  });
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
  image?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryId: string;
};

export async function createProduct(data: CreateProductData) {
  return db.product.create({
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