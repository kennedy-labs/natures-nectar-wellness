import { AdminCatalogManager } from "@/features/admin/components/AdminCatalogManager";
import { requireAdminPage } from "@/server/auth/admin-auth";
import { getAllCategories } from "@/server/services/category.service";
import { getAllProductsForAdmin } from "@/server/services/product.service";
import { AdminPaymentsPanel } from "@/features/admin/components/AdminPaymentsPanel";
import { getOrdersForAdmin } from "@/server/services/order.service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdminPage();

  const [categories, products, orders] = await Promise.all([
  getAllCategories(),
  getAllProductsForAdmin(),
  getOrdersForAdmin(),
]);

  const lowStockCount = products.filter(
  (product) => product.stockQuantity > 0 && product.stockQuantity <= 5
).length;

const outOfStockCount = products.filter(
  (product) => product.stockQuantity <= 0
).length;

const lowStockProducts = products.filter(
  (product) => product.stockQuantity > 0 && product.stockQuantity <= 5
);

const outOfStockProducts = products.filter(
  (product) => product.stockQuantity <= 0
);

const totalProducts = products.length;

const totalOrders = orders.length;

const pendingPayments = orders.flatMap(
  (order) => order.payments ?? []
).filter(
  (payment) => payment.status === "PENDING"
).length;

const verifiedPayments = orders.flatMap(
  (order) => order.payments ?? []
).filter(
  (payment) => payment.status === "VERIFIED"
).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <h1 className="text-3xl font-semibold">{user.email}</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h2 className="font-medium">Products</h2>
          <p className="mt-2 text-2xl font-bold">
       {totalProducts}
          </p>

          <p className="text-sm text-muted-foreground">
            Total products
           </p>

        </div>

        <div className="rounded-lg border bg-card p-4 text-card-foreground">
  <h2 className="font-medium">Inventory Alerts</h2>

  <p
    className={`mt-2 text-sm ${
      lowStockCount > 0 ? "text-amber-600 font-medium" : "text-green-600"
    }`}
  >
    ⚠️ Low stock: {lowStockCount}
  </p>

  <p
    className={`text-sm ${
      outOfStockCount > 0 ? "text-red-600 font-medium" : "text-green-600"
    }`}
  >
    ❌ Out of stock: {outOfStockCount}
  </p>

  {lowStockProducts.length > 0 && (
  <div className="mt-3 space-y-1">
    {lowStockProducts.map((product) => (
      <p key={product.id} className="text-xs text-amber-600">
        • {product.name} ({product.stockQuantity} left)
      </p>
    ))}
  </div>
)}

{outOfStockProducts.length > 0 && (
  <div className="mt-3 space-y-1">
    {outOfStockProducts.map((product) => (
      <p key={product.id} className="text-xs text-red-600">
        • {product.name} (OUT OF STOCK)
      </p>
    ))}
  </div>
)}

</div>

        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h2 className="font-medium">Orders</h2>
          <p className="mt-2 text-2xl font-bold">
  {totalOrders}
</p>

<p className="text-sm text-muted-foreground">
  Total orders
</p>
        </div>

        <div className="rounded-lg border bg-card p-4 text-card-foreground">
          <h2 className="font-medium">Payments</h2>
          <p className="mt-2 text-2xl font-bold">
  {pendingPayments}
</p>

<p className="text-sm text-muted-foreground">
  Pending payments
</p>
        </div>

        <div className="rounded-lg border bg-card p-4 text-card-foreground">
  <h2 className="font-medium">Verified Payments</h2>

  <p className="mt-2 text-2xl font-bold">
    {verifiedPayments}
  </p>

  <p className="text-sm text-muted-foreground">
    Verified payments
  </p>
</div>

      </section>

      
      <AdminPaymentsPanel />

      <AdminCatalogManager
        initialCategories={categories}
        initialProducts={products}
      />
    </main>
  );
}
