"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export type AdminTab = "overview" | "orders" | "catalog";

type AdminShellProps = {
  activeTab: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  adminEmail: string;
  pendingOrdersCount: number;
  lowStockCount: number;
  children: React.ReactNode;
};

export function AdminShell({
  activeTab,
  onTabChange,
  adminEmail,
  pendingOrdersCount,
  lowStockCount,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const navItems: Array<{
    key: AdminTab;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }> = [
    { key: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
    {
      key: "orders",
      label: "Orders",
      href: "/admin?tab=orders",
      icon: ShoppingBag,
      count: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      key: "catalog",
      label: "Catalog",
      href: "/admin?tab=catalog",
      icon: Package,
      count: lowStockCount > 0 ? lowStockCount : undefined,
    },
  ];

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-foreground">
      {/* Desktop Fixed Sidebar (lg+) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border/80 lg:bg-white">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">
            Nature&apos;s Nectar
          </span>
        </div>

        <nav aria-label="Admin sidebar navigation" className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const itemClass = `flex w-full min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`;

            const inner = (
              <>
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined ? (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </>
            );

            if (onTabChange) {
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onTabChange(item.key)}
                  className={itemClass}
                >
                  {inner}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={itemClass}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-border/70 p-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center justify-between rounded-lg border border-border/80 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <span>View storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>

          <div className="space-y-2 pt-1">
            <p className="truncate text-xs text-muted-foreground">{adminEmail}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={signingOut}
              onClick={handleSignOut}
              className="w-full justify-start px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              {signingOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Top Bar (Desktop Breadcrumb + Mobile Compact Bar) */}
        <header className="sticky top-0 z-30 border-b border-border/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="truncate text-sm font-semibold lg:hidden">
                Admin
              </span>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
                <span>Store Admin</span>
                <span aria-hidden="true">/</span>
                <span className="font-medium capitalize text-foreground">
                  {activeTab}
                </span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border/80 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 whitespace-nowrap"
              >
                <span>View store</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={signingOut}
                onClick={handleSignOut}
                className="min-h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive lg:hidden"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Horizontal Tab Switcher */}
          <nav
            aria-label="Admin sections"
            className="grid grid-cols-3 border-t border-border/60 bg-white px-2 py-1.5 lg:hidden"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              const mobileItemClass = `flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`;

              const inner = (
                <>
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.count !== undefined ? (
                    <span
                      className={`rounded px-1 text-[11px] tabular-nums ${
                        isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"
                      }`}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </>
              );

              if (onTabChange) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => onTabChange(item.key)}
                    className={mobileItemClass}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={mobileItemClass}
                >
                  {inner}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
