import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/config/site";
import { getStorefrontCategories } from "@/server/services/category.service";
import { getAllProducts } from "@/server/services/product.service";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: getAbsoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: getAbsoluteUrl("/products"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: getAbsoluteUrl("/categories"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getAbsoluteUrl("/privacy-policy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getAbsoluteUrl("/terms"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getAbsoluteUrl("/delivery-refund-policy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  try {
    const [categories, products] = await Promise.all([
      getStorefrontCategories(),
      getAllProducts(),
    ]);

    const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: getAbsoluteUrl(`/categories/${cat.slug}`),
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const productEntries: MetadataRoute.Sitemap = products.map((prod) => ({
      url: getAbsoluteUrl(`/products/${prod.slug}`),
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    }));

    return [...staticEntries, ...categoryEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
