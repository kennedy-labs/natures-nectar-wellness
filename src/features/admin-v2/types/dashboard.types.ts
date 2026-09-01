export type AttentionCardData = {
  title: string;
  count: number;
  description: string;
};

export type AdminDashboardData = {
  attentionCards: AttentionCardData[];
  recentOrders: unknown[];
};
