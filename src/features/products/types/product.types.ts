export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string | null;
  usageInstructions: string | null;
  ingredients: string | null;
  price: number;
  stockQuantity: number;
  image: string | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string;
  category?: ProductCategory;
  createdAt: Date | string;
  updatedAt: Date | string;
};
