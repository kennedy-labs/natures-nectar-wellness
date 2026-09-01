import { getDashboardData } from "@/server/repositories/admin-dashboard.repository";

export async function getAdminDashboard() {
  const dashboard = await getDashboardData();

  return {
    attentionCards: [
      {
        title: "New Orders",
        count: dashboard.newOrders,
        description: "Awaiting review",
      },
      {
        title: "Pending Payments",
        count: dashboard.pendingPayments,
        description: "Need verification",
      },
      {
        title: "Preparing Orders",
        count: dashboard.preparingOrders,
        description: "Being packed",
      },
      {
        title: "Ready for Pickup",
        count: dashboard.readyForPickup,
        description: "Notify customer",
      },
    ],

    recentOrders: dashboard.recentOrders,
  };
}