import { AdminDashboardTabs } from "@/features/admin/components/AdminDashboardTabs";
import type { AdminTab } from "@/features/admin/components/AdminShell";
import { requireAdminPage } from "@/server/auth/admin-auth";
import { getAllCategories } from "@/server/services/category.service";
import { getOrdersForAdmin } from "@/server/services/order.service";
import { getAllProductsForAdmin } from "@/server/services/product.service";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const adminSession = await requireAdminPage();
  const resolvedSearchParams = await searchParams;
  const rawTab = resolvedSearchParams.tab;
  const tab: AdminTab =
    rawTab === "orders" || rawTab === "catalog" ? rawTab : "overview";

  const [categories, products, orders] = await Promise.all([
    getAllCategories(),
    getAllProductsForAdmin(),
    getOrdersForAdmin(),
  ]);

  return (
    <AdminDashboardTabs
      initialTab={tab}
      adminEmail={adminSession.user.email}
      categories={categories}
      products={products}
      orders={orders}
    />
  );
}
