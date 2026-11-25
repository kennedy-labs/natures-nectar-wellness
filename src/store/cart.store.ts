import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stockQuantity: number;
  quantity: number;
};

export type AddToCartInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartState = {
  items: CartItem[];
  addItem: (input: AddToCartInput) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  getItemCount: () => number;
  getSubtotal: () => number;
};

function clampQuantity(quantity: number, stockQuantity: number) {
  if (stockQuantity <= 0) return 0;
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(Math.trunc(quantity), stockQuantity));
}

function normalizeProduct(input: AddToCartInput) {
  const productId = (input.productId ?? "").trim();
  const name = (input.name ?? "").trim();
  const slug = (input.slug ?? "").trim();

  if (!productId) throw new Error("Missing product id.");
  if (!slug) throw new Error("Missing product slug.");
  if (!name) throw new Error("Missing product name.");

  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Invalid product price.");
  }

  const stockQuantity = Math.max(0, Math.trunc(input.stockQuantity));
  const quantity = clampQuantity(input.quantity ?? 1, stockQuantity);

  return {
    productId,
    slug,
    name,
    price: input.price,
    image: input.image ?? null,
    stockQuantity,
    quantity,
  } satisfies CartItem;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const nextItem = normalizeProduct(input);

        if (nextItem.quantity <= 0) {
          throw new Error("This product is out of stock.");
        }

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === nextItem.productId
          );

          if (existingIndex === -1) {
            return { items: [...state.items, nextItem] };
          }

          const existing = state.items[existingIndex];

          const mergedQuantity = clampQuantity(
            existing.quantity + nextItem.quantity,
            nextItem.stockQuantity
          );

          const nextItems = [...state.items];
          nextItems[existingIndex] = {
            ...existing,
            ...nextItem,
            quantity: mergedQuantity,
          };

          return { items: nextItems };
        });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => {
          const nextItems = state.items
            .map((item) => {
              if (item.productId !== productId) return item;

              const nextQuantity = clampQuantity(quantity, item.stockQuantity);
              if (nextQuantity <= 0) return null;

              return { ...item, quantity: nextQuantity };
            })
            .filter(Boolean) as CartItem[];

          return { items: nextItems };
        }),

      clearCart: () => set({ items: [] }),

      getItemCount: () =>
        get().items.reduce((t, i) => t + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((t, i) => t + i.price * i.quantity, 0),
    }),
    {
      name: "nnw.cart.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);