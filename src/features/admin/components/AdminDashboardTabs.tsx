"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, ImageOff, ShoppingBag } from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { AdminCatalogManager } from "@/features/admin/components/AdminCatalogManager";
import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel";
import {
  AdminShell,
  type AdminTab,
} from "@/features/admin/components/AdminShell";
import type { Category } from "@/features/categories/types/category.types";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";

type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  subtotalAmount: number;
  deliveryFee?: number | null;
  totalAmount?: number | null;
  payments?: Array<{
    status: string;
    amount?: number | null;
  }>;
};

type AdminDashboardTabsProps = {
  initialTab: AdminTab;
  adminEmail: string;
  categories: Category[];
  products: Product[];
  orders: AdminOrderSummary[];
};

function parseTabFromLocation(): AdminTab {
  if (typeof window === "undefined") return "overview";
  const raw = new URLSearchParams(window.location.search).get("tab");
  return raw === "orders" || raw === "catalog" ? raw : "overview";
}

export function AdminDashboardTabs({
  initialTab,
  adminEmail,
  categories,
  products,
  orders,
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    function handlePopState() {
      setActiveTab(parseTabFromLocation());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function switchTab(nextTab: AdminTab) {
    setActiveTab(nextTab);
    if (typeof window !== "undefined") {
      const targetUrl =
        nextTab === "overview" ? "/admin" : `/admin?tab=${nextTab}`;
      if (
        `${window.location.pathname}${window.location.search}` !== targetUrl
      ) {
        window.history.pushState(null, "", targetUrl);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const activeProducts = products.filter((p) => p.isActive);
  const lowStockProducts = activeProducts.filter((p) => p.stockQuantity <= 5);
  const missingPhotoProducts = activeProducts.filter((p) => !p.image);

  const pendingOrders = orders.filter(
    (o) => !["DELIVERED", "CANCELLED"].includes(o.status)
  );
  const needsVerificationOrders = orders.filter((o) =>
    ["PENDING", "REVIEWING_DELIVERY", "AWAITING_PAYMENT"].includes(o.status)
  );

  const verifiedPayments = orders
    .flatMap((o) => o.payments ?? [])
    .filter((p) => p.status === "VERIFIED");

  const verifiedRevenue = verifiedPayments.reduce(
    (sum, p) => sum + (p.amount ?? 0),
    0
  );

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={switchTab}
      adminEmail={adminEmail}
      pendingOrdersCount={needsVerificationOrders.length}
      lowStockCount={lowStockProducts.length}
    >
      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Store Overview
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track incoming orders, verified revenue, and inventory health.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-10"
                onClick={() => switchTab("orders")}
              >
                Review orders
              </Button>
              <Button
                type="button"
                className="min-h-10"
                onClick={() => switchTab("catalog")}
              >
                Manage catalog
              </Button>
            </div>
          </div>

          {missingPhotoProducts.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ImageOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-amber-950">
                    {missingPhotoProducts.length} active product
                    {missingPhotoProducts.length === 1 ? " is" : "s are"} missing
                    a photo
                  </p>
                  <p className="text-xs text-amber-800">
                    Upload product images in Catalog so shoppers and Google see
                    clear photos.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-9 shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                onClick={() => switchTab("catalog")}
              >
                Upload photos
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard
              title="Verified Revenue"
              value={formatKes(verifiedRevenue)}
              subtext={`${verifiedPayments.length} verified payment(s)`}
              tone="success"
            />
            <StatsCard
              title="Open Orders"
              value={pendingOrders.length}
              subtext={`${needsVerificationOrders.length} awaiting quote or payment`}
              onClick={() => switchTab("orders")}
            />
            <StatsCard
              title="Active Products"
              value={activeProducts.length}
              subtext={`${categories.length} categories`}
              onClick={() => switchTab("catalog")}
            />
            <StatsCard
              title="Low / Out of Stock"
              value={lowStockProducts.length}
              subtext="5 units or fewer remaining"
              tone={lowStockProducts.length > 0 ? "warning" : "default"}
              onClick={() => switchTab("catalog")}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Recent Orders</h2>
                <button
                  type="button"
                  onClick={() => switchTab("orders")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all →
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="mb-2 h-6 w-6 text-muted-foreground/60" />
                  No orders received yet.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {orders.slice(0, 5).map((order) => {
                    const orderTotal =
                      order.totalAmount ??
                      order.subtotalAmount + (order.deliveryFee ?? 0);
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {order.customerName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="font-mono">{order.orderNumber}</span>{" "}
                            · {order.status.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className="shrink-0 font-medium tabular-nums">
                          {formatKes(orderTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/80 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Inventory Alerts</h2>
                <button
                  type="button"
                  onClick={() => switchTab("catalog")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open catalog →
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  All active products have healthy stock levels.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatKes(product.price)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium tabular-nums ${
                          product.stockQuantity === 0
                            ? "text-destructive"
                            : "text-amber-700"
                        }`}
                      >
                        {product.stockQuantity === 0
                          ? "Out of stock"
                          : `${product.stockQuantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verify M-Pesa references, set delivery quotes, and manage
              fulfillment.
            </p>
          </div>
          <AdminOrdersPanel />
        </div>
      ) : null}

      <div className={activeTab === "catalog" ? "space-y-5" : "hidden"}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload photos, update Kenyan KES prices, and manage stock and
            categories.
          </p>
        </div>
        <AdminCatalogManager
          initialCategories={categories}
          initialProducts={products}
        />
      </div>
    </AdminShell>
  );
}
