import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Package } from "lucide-react";
import { requireAdminPage } from "@/server/auth/admin-auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin?tab=orders", icon: ShoppingBag },
    { label: "Catalog", href: "/admin?tab=catalog", icon: Package },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6">
        <div className="mb-10">
          <h2 className="text-lg font-bold text-primary">Nature&apos;s Nectar</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Admin Panel
          </p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-slate-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
