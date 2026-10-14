import { AdminCatalogManager } from "@/features/admin/components/AdminCatalogManager";
import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel";
import { requireAdminPage } from "@/server/auth/admin-auth";
import { getAllCategories } from "@/server/services/category.service";
import { getAllProductsForAdmin } from "@/server/services/product.service";
import { getOrdersForAdmin } from "@/server/services/order.service";
import { StatsCard } from "@/components/admin/StatsCard";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  await requireAdminPage();
  const tab = searchParams.tab || "overview";

  const [categories, products, orders] = await Promise.all([
    getAllCategories(),
    getAllProductsForAdmin(),
    getOrdersForAdmin(),
  ]);

  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const pendingPayments = orders.flatMap((o) => o.payments ?? []).filter((p) => p.status === "PENDING").length;
  const verifiedPayments = orders.flatMap((o) => o.payments ?? []).filter((p) => p.status === "VERIFIED").length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight capitalize">{tab}</h1>
      </header>

      {tab === "overview" && (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Products" value={products.length} />
          <StatsCard title="Pending Payments" value={pendingPayments} />
          <StatsCard title="Low Stock" value={lowStockCount} subtext="Needs attention" />
          <StatsCard title="Verified Payments" value={verifiedPayments} />
        </section>
      )}

      {tab === "orders" && (
        <section>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <AdminOrdersPanel />
          </div>
        </section>
      )}

      {tab === "catalog" && (
        <section>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <AdminCatalogManager
              initialCategories={categories}
              initialProducts={products}
            />
          </div>
        </section>
      )}
    </div>
  );
}
