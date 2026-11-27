"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, ImageOff, ShoppingBag } from "lucide-react";

import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { AdminCatalogManager } from "@/features/admin/components/AdminCatalogManager";
import {
  type AdminOrder,
  AdminOrdersPanel,
} from "@/features/admin/components/AdminOrdersPanel";
import {
  AdminShell,
  type AdminTab,
} from "@/features/admin/components/AdminShell";
import type { Category } from "@/features/categories/types/category.types";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";

type AdminDashboardTabsProps = {
  initialTab: AdminTab;
  adminEmail: string;
  categories: Category[];
  products: Product[];
  orders: AdminOrder[];
};

function parseTabFromLocation(): AdminTab {
  if (typeof window === "undefined") return "overview";
  const raw = new URLSearchParams(window.location.search).get("tab");
  return raw === "orders" || raw === "catalog" ? raw : "overview";
}

export function AdminDashboardTabs({
  initialTab,
  adminEmail,
  categories: initialCategories,
  products: initialProducts,
  orders: initialOrders,
}: AdminDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [hasOpenedCatalog, setHasOpenedCatalog] = useState(
    initialTab === "catalog"
  );
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    function handlePopState() {
      const next = parseTabFromLocation();
      setActiveTab(next);
      if (next === "catalog") {
        setHasOpenedCatalog(true);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function switchTab(nextTab: AdminTab) {
    setActiveTab(nextTab);
    if (nextTab === "catalog") {
      setHasOpenedCatalog(true);
    }
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
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
                Daily Operations
              </p>
              <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
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
                className="min-h-10 bg-white"
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
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300/80 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ImageOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-medium text-amber-950 tabular-nums">
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

          {/* Hairline-Divided 4-Metric KPI Strip */}
          <section
            aria-label="Key store metrics"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4"
          >
            <StatsCard
              grouped
              title="Verified Revenue"
              value={formatKes(verifiedRevenue)}
              subtext={`${verifiedPayments.length} verified payment(s)`}
              tone="success"
            />
            <StatsCard
              grouped
              title="Open Orders"
              value={pendingOrders.length}
              subtext={`${needsVerificationOrders.length} awaiting quote or payment`}
              onClick={() => switchTab("orders")}
            />
            <StatsCard
              grouped
              title="Active Products"
              value={activeProducts.length}
              subtext={`${categories.length} categories`}
              onClick={() => switchTab("catalog")}
            />
            <StatsCard
              grouped
              title="Low / Out of Stock"
              value={lowStockProducts.length}
              subtext="5 units or fewer remaining"
              tone={lowStockProducts.length > 0 ? "warning" : "default"}
              onClick={() => switchTab("catalog")}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
                <h2 className="font-display text-lg font-medium text-foreground">
                  Recent Orders
                </h2>
                <button
                  type="button"
                  onClick={() => switchTab("orders")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                  <ShoppingBag className="mb-2 h-6 w-6 text-muted-foreground/60" />
                  No orders received yet.
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {orders.slice(0, 5).map((order) => {
                    const orderTotal =
                      order.totalAmount ??
                      order.subtotalAmount + (order.deliveryFee ?? 0);
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => switchTab("orders")}
                        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm transition-colors hover:bg-[#F6F7F5]/70 first:pt-1 last:pb-1"
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
                        <span className="shrink-0 font-medium tabular-nums text-foreground">
                          {formatKes(orderTotal)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
                <h2 className="font-display text-lg font-medium text-foreground">
                  Inventory Alerts
                </h2>
                <button
                  type="button"
                  onClick={() => switchTab("catalog")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open catalog
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  All active products have healthy stock levels.
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => switchTab("catalog")}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm transition-colors hover:bg-[#F6F7F5]/70 first:pt-1 last:pb-1"
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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="space-y-5">
          <div className="border-b border-border pb-4">
            <p className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
              Fulfillment Queue
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verify M-Pesa references, set delivery quotes, and manage
              fulfillment.
            </p>
          </div>
          <AdminOrdersPanel
            initialOrders={orders}
            onOrdersChange={setOrders}
          />
        </div>
      ) : null}

      {hasOpenedCatalog ? (
        <div className={activeTab === "catalog" ? "space-y-5" : "hidden"}>
          <div className="border-b border-border pb-4">
            <p className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
              Storefront Inventory
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Catalog
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload photos, update Kenyan KES prices, and manage stock and
              categories.
            </p>
          </div>
          <AdminCatalogManager
            initialCategories={categories}
            initialProducts={products}
            onCategoriesChange={setCategories}
            onProductsChange={setProducts}
          />
        </div>
      ) : null}
    </AdminShell>
  );
}
