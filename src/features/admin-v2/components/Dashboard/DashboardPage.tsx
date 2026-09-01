"use client";

import { AttentionCard } from "./AttentionCard";
import { RecentOrders } from "./RecentOrders";

import { useDashboard } from "../../hooks/useDashboard";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <main className="p-8">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="p-8">
        <p>Failed to load dashboard.</p>
      </main>
    );
  }

  const dashboard = data;

  return (
    <main className="space-y-8 p-8">
      <header>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-muted-foreground">
          Welcome back.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.attentionCards.map((card) => (
          <AttentionCard
            key={card.title}
            title={card.title}
            count={card.count}
            description={card.description}
          />
        ))}
      </section>

      <section>
        <RecentOrders />
      </section>
    </main>
  );
}