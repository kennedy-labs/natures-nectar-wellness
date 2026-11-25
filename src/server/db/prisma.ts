/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolveDevDatabaseUrl(): string | undefined {
  if (process.env.NODE_ENV === "production") {
    return process.env.DATABASE_URL;
  }

  try {
    const localEnvPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(localEnvPath)) {
      const content = fs.readFileSync(localEnvPath, "utf8");
      const match = content.match(/^DATABASE_URL=(?:"([^"]+)"|'([^']+)'|(.+))$/m);
      const localUrl = (match?.[1] ?? match?.[2] ?? match?.[3])?.trim();
      if (localUrl) {
        process.env.DATABASE_URL = localUrl;
        return localUrl;
      }
    }
  } catch {
    // Fall back to process.env.DATABASE_URL
  }

  return process.env.DATABASE_URL;
}

// Initial Mock Seed Data
const initialCategories = [
  {
    id: "cat-supplements",
    name: "Supplements",
    slug: "supplements",
    description: "Daily wellness support made from nature-forward ingredients",
    image: "/images/ashwagandha-tincture.jpg",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "cat-herbal-blends",
    name: "Herbal Blends",
    slug: "herbal-blends",
    description: "Loose-leaf blends for calm, energy, and recovery rituals",
    image: "/images/hibiscus-tisane.jpg",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "cat-honey-resins",
    name: "Honey & Resins",
    slug: "honey-resins",
    description: "Wild forest honey and potent mineral resins from East Africa",
    image: "/images/mau-forest-honey.jpg",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: "cat-topicals",
    name: "Botanical Topicals",
    slug: "topicals",
    description: "Handcrafted restorative balms and soothing herbal ointments",
    image: "/images/neem-balm.jpg",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
];

const initialProducts = [
  {
    id: "prod-honey",
    name: "Mau Forest Raw Honey",
    slug: "mau-forest-raw-honey",
    description:
      "Pure, unfiltered wild honey harvested from the indigenous flora of the Mau Forest ecosystem. Rich in floral nectar notes and natural enzymes.",
    benefits: "Natural throat soothing, active digestive support, and pure unrefined energy.",
    usageInstructions: "Enjoy 1-2 teaspoons daily directly, stirred into herbal tea, or paired with breakfast bowls.",
    ingredients: "100% Pure Raw Mau Forest Honey",
    price: 1850,
    stockQuantity: 28,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-honey-resins",
    image: "/images/mau-forest-honey.jpg",
    createdAt: new Date("2025-01-02T00:00:00Z"),
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  },
  {
    id: "prod-shilajit",
    name: "High-Altitude Shilajit Resin",
    slug: "shilajit-resin",
    description:
      "Authentic purified mineral pitch rich in fulvic acid, humic minerals, and 84+ trace ionic elements.",
    benefits: "Enhances stamina, improves cellular vitality, and supports physical resilience.",
    usageInstructions:
      "Dissolve a pea-sized portion (300-500mg) in warm herbal tea, milk, or pure spring water in the morning.",
    ingredients: "100% Purified High-Altitude Mineral Pitch Resin",
    price: 3400,
    stockQuantity: 15,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-honey-resins",
    image: "/images/shilajit-resin.jpg",
    createdAt: new Date("2025-01-03T00:00:00Z"),
    updatedAt: new Date("2025-01-03T00:00:00Z"),
  },
  {
    id: "prod-ashwagandha",
    name: "Ashwagandha Adaptogen Tincture",
    slug: "ashwagandha-tincture",
    description:
      "Traditional dual-extracted Withania somnifera root formulated to balance cortisol and calm an overactive nervous system.",
    benefits: "Assists emotional balance, promotes restorative evening relaxation, and counters chronic fatigue.",
    usageInstructions: "Take 1-2 full pipettes (1-2ml) in water or juice once or twice daily.",
    ingredients: "Ashwagandha Root Extract, Organic Cane Alcohol, Spring Water",
    price: 2200,
    stockQuantity: 34,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-supplements",
    image: "/images/ashwagandha-tincture.jpg",
    createdAt: new Date("2025-01-04T00:00:00Z"),
    updatedAt: new Date("2025-01-04T00:00:00Z"),
  },
  {
    id: "prod-hibiscus",
    name: "Organic Hibiscus Ruby Tisane",
    slug: "hibiscus-tisane",
    description:
      "Sun-dried whole hibiscus calyces delivering a tart, deeply crimson brew loaded with vitamin C and anthocyanins.",
    benefits: "Supports healthy cardiovascular circulation, gentle hydration, and antioxidant defenses.",
    usageInstructions:
      "Steep 1 tablespoon in boiling water for 5-7 minutes. Delicious both steaming hot or chilled over ice.",
    ingredients: "100% Organic Sun-Dried Whole Hibiscus Sabdariffa Calyces",
    price: 1200,
    stockQuantity: 42,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-herbal-blends",
    image: "/images/hibiscus-tisane.jpg",
    createdAt: new Date("2025-01-05T00:00:00Z"),
    updatedAt: new Date("2025-01-05T00:00:00Z"),
  },
  {
    id: "prod-moringa",
    name: "Raw Moringa Leaf Powder",
    slug: "moringa-powder",
    description:
      "Shade-dried Kenyan moringa leaves gently ground to retain optimum chlorophyll, bioavailable iron, and phytonutrients.",
    benefits: "Nutrient-dense green daily boost, supporting natural immunity and vibrant metabolic wellness.",
    usageInstructions: "Whisk 1 teaspoon into smoothies, fresh citrus juices, oatmeal, or warm soups.",
    ingredients: "100% Shade-Dried Moringa Oleifera Leaf Powder",
    price: 950,
    stockQuantity: 50,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-supplements",
    image: "/images/moringa-powder.jpg",
    createdAt: new Date("2025-01-06T00:00:00Z"),
    updatedAt: new Date("2025-01-06T00:00:00Z"),
  },
  {
    id: "prod-neem",
    name: "Restorative Neem Botanical Balm",
    slug: "neem-balm",
    description:
      "Intense protective barrier balm combining cold-pressed neem seed oil, unrefined beeswax, and soothing essential oils.",
    benefits: "Calms irritated dry skin patches, supports natural cutaneous healing, and deeply moisturizes.",
    usageInstructions:
      "Warm a small amount between clean fingertips and gently massage onto targeted skin areas as needed.",
    ingredients: "Cold-Pressed Neem Oil, Pure Yellow Beeswax, Shea Butter, Lavender Essential Oil",
    price: 1400,
    stockQuantity: 22,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-topicals",
    image: "/images/neem-balm.jpg",
    createdAt: new Date("2025-01-07T00:00:00Z"),
    updatedAt: new Date("2025-01-07T00:00:00Z"),
  },
  {
    id: "prod-seamoss",
    name: "Sea Moss Capsules",
    slug: "sea-moss-capsules",
    description:
      "Mineral-rich capsules for daily wellness support harvested wild from East African coral waters.",
    benefits: "Supports energy, immunity, and essential mineral replenishment.",
    usageInstructions: "Take 2 capsules daily with a glass of water.",
    ingredients: "Wildcrafted Gold Sea Moss, Vegetable Cellulose Capsule",
    price: 2900,
    stockQuantity: 50,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-supplements",
    image: "/images/sea-moss-capsules.jpg",
    createdAt: new Date("2025-01-08T00:00:00Z"),
    updatedAt: new Date("2025-01-08T00:00:00Z"),
  },
  {
    id: "prod-elderberry",
    name: "Elderberry Defense Syrup",
    slug: "elderberry-defense-syrup",
    description: "A concentrated herbal syrup for seasonal support crafted with wild elderberries and raw honey.",
    benefits: "Helps support immune resilience during busy seasons.",
    usageInstructions: "Take 1 tablespoon daily for wellness maintenance.",
    ingredients: "Elderberry, Raw Honey, Ceylon Cinnamon, Ginger Root",
    price: 2450,
    stockQuantity: 18,
    isFeatured: true,
    isActive: true,
    categoryId: "cat-herbal-blends",
    image: "/images/elderberry-defense-syrup.jpg",
    createdAt: new Date("2025-01-09T00:00:00Z"),
    updatedAt: new Date("2025-01-09T00:00:00Z"),
  },
  {
    id: "prod-calm-tea",
    name: "Calm Rest Tea",
    slug: "calm-rest-tea",
    description: "A caffeine-free botanical blend for evening routines.",
    benefits: "Encourages relaxation and a steady nighttime wind-down.",
    usageInstructions: "Steep 1 tea sachet in freshly boiled water for 8 minutes before bedtime.",
    ingredients: "Chamomile Flowers, Spearmint, Lemongrass, Valerian Root",
    price: 1600,
    stockQuantity: 12,
    isFeatured: false,
    isActive: true,
    categoryId: "cat-herbal-blends",
    image: "/images/calm-rest-tea.jpg",
    createdAt: new Date("2025-01-10T00:00:00Z"),
    updatedAt: new Date("2025-01-10T00:00:00Z"),
  },
];

// In-Memory Database collections
class InMemoryDB {
  categories = [...initialCategories];
  products = [...initialProducts];
  users: any[] = [
    {
      id: "admin-user-1",
      name: "Nature's Nectar Admin",
      email: "admin@naturesnectar.co.ke",
      emailVerified: true,
      image: null,
      role: "ADMIN",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  sessions: any[] = [];
  accounts: any[] = [];
  verifications: any[] = [];
  customers: any[] = [];
  orders: any[] = [];
  orderItems: any[] = [];
  payments: any[] = [];
  orderStatusHistory: any[] = [];

  getTable(modelName: string): any[] {
    const key = modelName.toLowerCase();
    switch (key) {
      case "category":
        return this.categories;
      case "product":
        return this.products;
      case "user":
        return this.users;
      case "session":
        return this.sessions;
      case "account":
        return this.accounts;
      case "verification":
        return this.verifications;
      case "customer":
        return this.customers;
      case "order":
        return this.orders;
      case "orderitem":
        return this.orderItems;
      case "payment":
        return this.payments;
      case "orderstatushistory":
        return this.orderStatusHistory;
      default:
        return [];
    }
  }

  matchWhere(item: any, where?: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;
      if (key === "category" && typeof value === "object" && value !== null) {
        const cat = this.categories.find((c) => c.id === item.categoryId);
        if (!cat || !this.matchWhere(cat, value)) return false;
        continue;
      }
      if (typeof value === "object" && value !== null) {
        if ("in" in value && Array.isArray((value as any).in)) {
          if (!(value as any).in.includes(item[key])) return false;
          continue;
        }
        if ("equals" in value) {
          if (item[key] !== (value as any).equals) return false;
          continue;
        }
      }
      if (item[key] !== value) return false;
    }
    return true;
  }

  attachRelations(item: any, modelName: string, include?: any): any {
    if (!item) return null;
    const cloned = { ...item };
    if (!include) return cloned;

    if (modelName.toLowerCase() === "product" && include.category) {
      cloned.category = this.categories.find((c) => c.id === cloned.categoryId) || null;
    }
    if (modelName.toLowerCase() === "category" && include.products) {
      cloned.products = this.products.filter((p) => p.categoryId === cloned.id);
    }
    if (modelName.toLowerCase() === "order") {
      if (include.items) {
        cloned.items = this.orderItems.filter((i) => i.orderId === cloned.id);
      }
      if (include.payments) {
        cloned.payments = this.payments.filter((p) => p.orderId === cloned.id);
      }
      if (include.customer) {
        cloned.customer = this.customers.find((c) => c.id === cloned.customerId) || null;
      }
    }
    return cloned;
  }
}

const memoryDb = new InMemoryDB();

function createModelHandler(modelName: string, prismaModel?: any) {
  const handler = {
    findMany: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.findMany(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      let results = table.filter((item) => memoryDb.matchWhere(item, args?.where));

      if (args?.orderBy) {
        const orderKey = Object.keys(args.orderBy)[0];
        const dir = args.orderBy[orderKey];
        results.sort((a, b) => {
          if (dir === "desc") return b[orderKey] > a[orderKey] ? 1 : -1;
          return a[orderKey] > b[orderKey] ? 1 : -1;
        });
      }

      if (typeof args?.take === "number") {
        results = results.slice(0, args.take);
      }

      return results.map((item) => memoryDb.attachRelations(item, modelName, args?.include));
    },

    findFirst: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.findFirst(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      const item = table.find((x) => memoryDb.matchWhere(x, args?.where));
      return item ? memoryDb.attachRelations(item, modelName, args?.include) : null;
    },

    findUnique: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.findUnique(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      const item = table.find((x) => memoryDb.matchWhere(x, args?.where));
      return item ? memoryDb.attachRelations(item, modelName, args?.include) : null;
    },

    count: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.count(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      return table.filter((item) => memoryDb.matchWhere(item, args?.where)).length;
    },

    create: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.create(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      const newItem = {
        id: args?.data?.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args?.data,
      };
      table.push(newItem);
      return memoryDb.attachRelations(newItem, modelName, args?.include);
    },

    update: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.update(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      const index = table.findIndex((x) => memoryDb.matchWhere(x, args?.where));
      if (index === -1) {
        return null;
      }
      const updated = {
        ...table[index],
        ...args?.data,
        updatedAt: new Date(),
      };
      table[index] = updated;
      return memoryDb.attachRelations(updated, modelName, args?.include);
    },

    delete: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.delete(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      const index = table.findIndex((x) => memoryDb.matchWhere(x, args?.where));
      if (index !== -1) {
        const [removed] = table.splice(index, 1);
        return removed;
      }
      return null;
    },

    upsert: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.upsert(args);
        } catch {
          // fallback to memory
        }
      }
      const existing = await handler.findUnique({ where: args?.where });
      if (existing) {
        return handler.update({ where: args?.where, data: args?.update });
      }
      return handler.create({ data: args?.create });
    },

    updateMany: async (args?: any) => {
      if (prismaModel) {
        try {
          return await prismaModel.updateMany(args);
        } catch {
          // fallback to memory
        }
      }
      const table = memoryDb.getTable(modelName);
      let count = 0;
      for (let i = 0; i < table.length; i += 1) {
        const current = table[i];
        let matches = true;
        if (args?.where) {
          for (const [key, value] of Object.entries(args.where)) {
            if (value === undefined) continue;
            if (
              typeof value === "object" &&
              value !== null &&
              "gte" in value
            ) {
              if (!(current[key] >= (value as any).gte)) {
                matches = false;
                break;
              }
              continue;
            }
            if (current[key] !== value) {
              matches = false;
              break;
            }
          }
        }
        if (matches) {
          const next = { ...current, updatedAt: new Date() };
          for (const [k, v] of Object.entries(args?.data ?? {})) {
            if (
              typeof v === "object" &&
              v !== null &&
              "decrement" in v &&
              typeof next[k] === "number"
            ) {
              next[k] -= Number((v as any).decrement);
            } else {
              next[k] = v;
            }
          }
          table[i] = next;
          count += 1;
        }
      }
      return { count };
    },
  };

  return handler;
}

declare global {
  var prisma: PrismaClient | undefined;
  var dbProxy: any | undefined;
}

const datasourceUrl = resolveDevDatabaseUrl();

let rawPrisma: PrismaClient | undefined;
try {
  rawPrisma =
    global.prisma ??
    new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
  if (process.env.NODE_ENV !== "production") {
    global.prisma = rawPrisma;
  }
} catch {
  console.warn("[AI Studio] PrismaClient initialization deferred to in-memory store");
}

function buildDbProxy() {
  const modelHandlers = new Map<string, any>();

  return new Proxy(rawPrisma ?? {}, {
    get(target, prop, receiver) {
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }

      if (prop === "$transaction") {
        if (rawPrisma && datasourceUrl) {
          return rawPrisma.$transaction.bind(rawPrisma);
        }
        return async (callback: any) => {
          if (typeof callback === "function") {
            return callback(receiver);
          }
          if (Array.isArray(callback)) {
            return Promise.all(callback);
          }
          return [];
        };
      }

      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        if (rawPrisma && datasourceUrl) {
          return (rawPrisma as any)[prop].bind(rawPrisma);
        }
        return async () => [{ "1": 1 }];
      }

      if (prop === "$connect" || prop === "$disconnect") {
        if (rawPrisma && datasourceUrl) {
          return (rawPrisma as any)[prop].bind(rawPrisma);
        }
        return async () => {};
      }

      if (!modelHandlers.has(prop)) {
        const prismaModel = datasourceUrl ? (target as any)?.[prop] : undefined;
        modelHandlers.set(prop, createModelHandler(prop, prismaModel));
      }

      return modelHandlers.get(prop);
    },
  });
}

export const db: PrismaClient = global.dbProxy ?? (global.dbProxy = buildDbProxy());