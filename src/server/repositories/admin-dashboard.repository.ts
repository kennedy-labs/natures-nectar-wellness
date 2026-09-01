import { db } from "@/server/db/prisma";

export async function getDashboardData() {
  return {
    newOrders: await db.order.count({
  where: {
    status: "PENDING",
    },
    }),

    pendingPayments: await db.payment.count({
    where: {
    status: "PENDING",
    },
    }),

    preparingOrders: await db.order.count({
  where: {
    status: "PROCESSING",
  },
}),

    readyForPickup: 0,

    recentOrders: await db.order.findMany({
  orderBy: {
    createdAt: "desc",
  },
  take: 5,
  select: {
    id: true,
    orderNumber: true,
    customerName: true,
    totalAmount: true,
    status: true,
    createdAt: true,
  },
}),
  };
}
