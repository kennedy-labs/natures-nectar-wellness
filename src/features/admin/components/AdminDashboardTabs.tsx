"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminActionQueue } from "@/features/admin/components/AdminActionQueue";
import { AdminCancelOrderDialog } from "@/features/admin/components/AdminCancelOrderDialog";
import {
  AdminCatalogManager,
  type CatalogFocusRequest,
  type CatalogProductFilter,
} from "@/features/admin/components/AdminCatalogManager";
import { AdminDeleteOrderDialog } from "@/features/admin/components/AdminDeleteOrderDialog";
import { AdminOrderDetailSheet } from "@/features/admin/components/AdminOrderDetailSheet";
import {
  type AdminOrder,
  AdminOrdersPanel,
  type OrderViewFilter,
} from "@/features/admin/components/AdminOrdersPanel";
import {
  AdminShell,
  type AdminTab,
} from "@/features/admin/components/AdminShell";
import {
  AdminToastViewport,
  useAdminToastQueue,
} from "@/features/admin/components/AdminToastViewport";
import { useAdminOrderActions } from "@/features/admin/hooks/useAdminOrderActions";
import {
  isDecisionRequiredStage,
  isUndoneOrderStage,
} from "@/features/admin/utils/order-display.utils";
import type { Category } from "@/features/categories/types/category.types";
import {
  normalizeOrderStage,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";
import type { Product } from "@/features/products/types/product.types";

type AdminDashboardTabsProps = {
  initialTab: AdminTab;
  adminEmail: string;
  categories: Category[];
  products: Product[];
  orders: AdminOrder[];
};

function parseTabFromLocation(): AdminTab {
  if (typeof window === "undefined") return "queue";
  const raw = new URLSearchParams(window.location.search).get("tab");
  return raw === "orders" || raw === "catalog" ? raw : "queue";
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
  const [ordersFilter, setOrdersFilter] = useState<OrderViewFilter>("undone");
  const [catalogFocus, setCatalogFocus] = useState<CatalogFocusRequest | null>(
    null
  );

  const { toasts, pushToast, dismissToast } = useAdminToastQueue();

  const orderActions = useAdminOrderActions({
    orders,
    onOrdersChange: setOrders,
    onToast: pushToast,
  });

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
      const targetUrl = nextTab === "queue" ? "/admin" : `/admin?tab=${nextTab}`;
      if (
        `${window.location.pathname}${window.location.search}` !== targetUrl
      ) {
        window.history.pushState(null, "", targetUrl);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleOpenOrdersTab(
    stageFilter?: "undone" | "completed" | UnifiedOrderStage
  ) {
    if (stageFilter) {
      setOrdersFilter(stageFilter);
    }
    switchTab("orders");
  }

  function handleOpenCatalogFilter(
    filter: CatalogProductFilter,
    productId?: string
  ) {
    setCatalogFocus({
      filter,
      productId,
      nonce: Date.now(),
    });
    switchTab("catalog");
  }

  const activeProducts = products.filter((p) => p.isActive);
  const catalogBlockersCount = activeProducts.filter(
    (p) => !p.image || p.stockQuantity <= 5
  ).length;

  const undoneOrdersCount = orders.filter((o) =>
    isUndoneOrderStage(normalizeOrderStage(o))
  ).length;
  const decisionOrdersCount = orders.filter((o) =>
    isDecisionRequiredStage(normalizeOrderStage(o))
  ).length;

  const activeOrder = useMemo(
    () =>
      orders.find((order) => order.id === orderActions.activeOrderId) ?? null,
    [orders, orderActions.activeOrderId]
  );

  const ordersTabSubheading =
    undoneOrdersCount === 0
      ? "All orders are delivered or cancelled. Browse completed history below."
      : `${undoneOrdersCount} undone order${undoneOrdersCount === 1 ? "" : "s"} (${decisionOrdersCount} awaiting decision). Unfinished work stays separated from completed orders.`;

  const catalogTabSubheading =
    catalogBlockersCount === 0
      ? `${activeProducts.length} active products — all stocked and photographed.`
      : `${catalogBlockersCount} active product${catalogBlockersCount === 1 ? "" : "s"} need a photo or restock below.`;

  return (
    <AdminShell
      activeTab={activeTab}
      onTabChange={switchTab}
      adminEmail={adminEmail}
      decisionOrdersCount={decisionOrdersCount}
      undoneOrdersCount={undoneOrdersCount}
      catalogBlockersCount={catalogBlockersCount}
    >
      {activeTab === "queue" ? (
        <AdminActionQueue
          orders={orders}
          products={products}
          categoriesCount={categories.length}
          refreshing={orderActions.refreshing}
          busyOrderId={orderActions.busyOrderId}
          recentlyCompleted={orderActions.recentlyCompleted}
          onRefresh={orderActions.load}
          onOpenOrder={orderActions.openOrder}
          onNextAction={(order, action) =>
            void orderActions.handleNextAction(order, action)
          }
          onCancelOrder={(order) => orderActions.setOrderToCancel(order)}
          onDeleteOrder={(order) => orderActions.setOrderToDelete(order)}
          onOpenOrdersTab={handleOpenOrdersTab}
          onOpenCatalogFilter={handleOpenCatalogFilter}
        />
      ) : null}

      {activeTab === "orders" ? (
        <div className="space-y-5">
          <div className="border-b border-[#E3DFD6] pb-4">
            <p className="text-xs font-semibold text-[#1F4E37]">
              Fulfillment Queue
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-[#14221B] sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-[#55635C] tabular-nums">
              {ordersTabSubheading}
            </p>
          </div>
          <AdminOrdersPanel
            initialOrders={orders}
            onOrdersChange={setOrders}
            selectedOrderId={orderActions.activeOrderId}
            onSelectedOrderIdChange={(id) =>
              id ? orderActions.openOrder(id, null) : orderActions.closeOrder()
            }
            filter={ordersFilter}
            onFilterChange={setOrdersFilter}
            sharedActions={orderActions}
            onToast={pushToast}
          />
        </div>
      ) : null}

      {hasOpenedCatalog ? (
        <div className={activeTab === "catalog" ? "space-y-5" : "hidden"}>
          <div className="border-b border-[#E3DFD6] pb-4">
            <p className="text-xs font-semibold text-[#1F4E37]">
              Storefront Inventory
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-[#14221B] sm:text-3xl">
              Catalog
            </h1>
            <p className="mt-1 text-sm text-[#55635C] tabular-nums">
              {catalogTabSubheading}
            </p>
          </div>
          <AdminCatalogManager
            key={catalogFocus?.nonce ?? "catalog-default"}
            initialCategories={categories}
            initialProducts={products}
            onCategoriesChange={setCategories}
            onProductsChange={setProducts}
            requestedFocus={catalogFocus}
            onToast={pushToast}
          />
        </div>
      ) : null}

      {/* Shared Slide-Over Order Details Drawer */}
      <AdminOrderDetailSheet
        order={activeOrder}
        focusSection={orderActions.drawerFocusSection}
        onClose={orderActions.closeOrder}
        onConfirmDeliveryQuote={orderActions.confirmDeliveryQuote}
        onUpdateStatus={orderActions.updateStatus}
        onVerifyPayment={orderActions.verifyPayment}
        onCancelOrder={orderActions.cancelOrder}
        onDeleteOrder={orderActions.deleteOrder}
      />

      {/* Shared Row Cancel Confirmation Modal */}
      <AdminCancelOrderDialog
        order={orderActions.orderToCancel}
        onClose={() => orderActions.setOrderToCancel(null)}
        onConfirmCancel={async (target) => {
          await orderActions.cancelOrder(target.id);
        }}
      />

      {/* Shared Row Delete Confirmation Modal */}
      <AdminDeleteOrderDialog
        order={orderActions.orderToDelete}
        onClose={() => orderActions.setOrderToDelete(null)}
        onConfirmDelete={orderActions.deleteOrder}
      />

      {/* Floating Confirmation Toast Stack */}
      <AdminToastViewport toasts={toasts} onDismiss={dismissToast} />
    </AdminShell>
  );
}
