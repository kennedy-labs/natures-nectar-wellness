import { db } from "@/server/db/prisma";
import { createProductSlug } from "@/features/products/utils/product.utils";

async function main() {
  const supplements = await db.category.upsert({
    where: {
      slug: "supplements",
    },
    update: {
      name: "Supplements",
      description: "Daily wellness support made from nature-forward ingredients",
    },
    create: {
      name: "Supplements",
      slug: "supplements",
      description: "Daily wellness support made from nature-forward ingredients",
    },
  });

  const herbalBlends = await db.category.upsert({
    where: {
      slug: "herbal-blends",
    },
    update: {
      name: "Herbal Blends",
      description: "Loose-leaf blends for calm, energy, and recovery rituals",
    },
    create: {
      name: "Herbal Blends",
      slug: "herbal-blends",
      description: "Loose-leaf blends for calm, energy, and recovery rituals",
    },
  });

  await db.product.upsert({
    where: {
      slug: "sea-moss-capsules",
    },
    update: {
      name: "Sea Moss Capsules",
      description: "Mineral-rich capsules for daily wellness support.",
      benefits: "Supports energy, immunity, and mineral replenishment.",
      price: 29.99,
      stockQuantity: 50,
      isFeatured: true,
      isActive: true,
      categoryId: supplements.id,
    },
    create: {
      name: "Sea Moss Capsules",
      slug: "sea-moss-capsules",
      description: "Mineral-rich capsules for daily wellness support.",
      benefits: "Supports energy, immunity, and mineral replenishment.",
      price: 29.99,
      stockQuantity: 50,
      isFeatured: true,
      categoryId: supplements.id,
    },
  });

  await db.product.upsert({
    where: {
      slug: createProductSlug("Elderberry Defense Syrup"),
    },
    update: {
      name: "Elderberry Defense Syrup",
      description: "A concentrated herbal syrup for seasonal support.",
      benefits: "Helps support immune resilience during busy seasons.",
      price: 24.5,
      stockQuantity: 18,
      isFeatured: true,
      isActive: true,
      categoryId: herbalBlends.id,
    },
    create: {
      name: "Elderberry Defense Syrup",
      slug: "elderberry-defense-syrup",
      description: "A concentrated herbal syrup for seasonal support.",
      benefits: "Helps support immune resilience during busy seasons.",
      price: 24.5,
      stockQuantity: 18,
      isFeatured: true,
      categoryId: herbalBlends.id,
    },
  });

  await db.product.upsert({
    where: {
      slug: "calm-rest-tea",
    },
    update: {
      name: "Calm Rest Tea",
      description: "A caffeine-free botanical blend for evening routines.",
      benefits: "Encourages relaxation and a steady nighttime wind-down.",
      price: 16,
      stockQuantity: 0,
      isFeatured: false,
      isActive: true,
      categoryId: herbalBlends.id,
    },
    create: {
      name: "Calm Rest Tea",
      slug: "calm-rest-tea",
      description: "A caffeine-free botanical blend for evening routines.",
      benefits: "Encourages relaxation and a steady nighttime wind-down.",
      price: 16,
      stockQuantity: 0,
      categoryId: herbalBlends.id,
    },
  });

  console.log("Seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await db.$disconnect();
  });
