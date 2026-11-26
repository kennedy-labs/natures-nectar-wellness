import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SavedOrderRef = {
  orderNumber: string;
  phone: string;
  savedAt: string;
};

type OrdersStoreState = {
  orders: SavedOrderRef[];
  saveOrderRef: (input: { orderNumber: string; phone: string }) => void;
  removeOrderRef: (orderNumber: string) => void;
  removeOrderRefs: (orderNumbers: string[]) => void;
  clearSavedOrders: () => void;
};

const MAX_SAVED_ORDERS = 25;

export const useOrdersStore = create<OrdersStoreState>()(
  persist(
    (set) => ({
      orders: [],

      saveOrderRef: ({ orderNumber, phone }) => {
        const normalizedOrder = orderNumber.trim().toUpperCase();
        const normalizedPhone = phone.trim();
        if (!normalizedOrder || !normalizedPhone) return;

        set((state) => {
          const filtered = state.orders.filter(
            (item) => item.orderNumber.toUpperCase() !== normalizedOrder
          );
          const next: SavedOrderRef[] = [
            {
              orderNumber: normalizedOrder,
              phone: normalizedPhone,
              savedAt: new Date().toISOString(),
            },
            ...filtered,
          ].slice(0, MAX_SAVED_ORDERS);

          return { orders: next };
        });
      },

      removeOrderRef: (orderNumber) => {
        const normalizedOrder = orderNumber.trim().toUpperCase();
        if (!normalizedOrder) return;

        set((state) => ({
          orders: state.orders.filter(
            (item) => item.orderNumber.toUpperCase() !== normalizedOrder
          ),
        }));
      },

      removeOrderRefs: (orderNumbers) => {
        const toRemove = new Set(
          orderNumbers.map((num) => num.trim().toUpperCase()).filter(Boolean)
        );
        if (toRemove.size === 0) return;

        set((state) => ({
          orders: state.orders.filter(
            (item) => !toRemove.has(item.orderNumber.toUpperCase())
          ),
        }));
      },

      clearSavedOrders: () => set({ orders: [] }),
    }),
    {
      name: "nnw.orders.v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        orders: state.orders,
      }),
    }
  )
);
