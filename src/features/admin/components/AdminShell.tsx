"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
  Leaf,
  LogOut,
  Package,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export type AdminTab = "queue" | "orders" | "catalog";

type AdminShellProps = {
  activeTab: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  adminEmail: string;
  decisionOrdersCount: number;
  undoneOrdersCount: number;
  catalogBlockersCount: number;
  children: React.ReactNode;
};

const TAB_LABELS: Record<AdminTab, string> = {
  queue: "Action Queue",
  orders: "Orders",
  catalog: "Catalog",
};

export function AdminShell({
  activeTab,
  onTabChange,
  adminEmail,
  decisionOrdersCount,
  undoneOrdersCount,
  catalogBlockersCount,
  children,
}: AdminShellProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const totalActionItems = undoneOrdersCount + catalogBlockersCount;

  const navItems: Array<{
    key: AdminTab;
    label: string;
    href: string;
    icon: typeof Inbox;
    count?: number;
    urgent?: boolean;
  }> = [
    {
      key: "queue",
      label: "Action Queue",
      href: "/admin",
      icon: Inbox,
      count: totalActionItems > 0 ? totalActionItems : undefined,
      urgent: decisionOrdersCount > 0 || catalogBlockersCount > 0,
    },
    {
      key: "orders",
      label: "Orders",
      href: "/admin?tab=orders",
      icon: ShoppingBag,
      count: undoneOrdersCount > 0 ? undoneOrdersCount : undefined,
      urgent: decisionOrdersCount > 0,
    },
    {
      key: "catalog",
      label: "Catalog",
      href: "/admin?tab=catalog",
      icon: Package,
      count: catalogBlockersCount > 0 ? catalogBlockersCount : undefined,
      urgent: catalogBlockersCount > 0,
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
    <div className="min-h-screen bg-[#F7F5F0] text-[#14221B]">
      {/* Deep Kenyan Pine Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#14221B]/10 lg:bg-[#14221B] lg:text-[#FCFBF8]">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1F4E37] text-[#FCFBF8] ring-1 ring-white/15">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-medium leading-tight tracking-tight text-[#FCFBF8]">
              Nature&apos;s Nectar
            </p>
            <p className="text-[11px] tracking-[0.04em] text-[#FCFBF8]/65">
              Operations Desk
            </p>
          </div>
        </div>

        <nav aria-label="Admin sidebar navigation" className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            const itemClass = cn(
              "flex w-full min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              isActive
                ? "bg-[#1F4E37] text-[#FCFBF8]"
                : "text-[#FCFBF8]/75 hover:bg-white/[0.07] hover:text-[#FCFBF8]"
            );

            const inner = (
              <>
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      item.urgent
                        ? "bg-[#F59E0B] text-[#14221B]"
                        : isActive
                          ? "bg-white/15 text-[#FCFBF8]"
                          : "bg-white/10 text-[#FCFBF8]/90"
                    )}
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

        <div className="space-y-3 border-t border-white/10 p-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center justify-between rounded-lg border border-white/15 bg-white/[0.05] px-3 text-xs font-medium text-[#FCFBF8] transition-colors hover:bg-white/[0.1]"
          >
            <span>View storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#FCFBF8]/70" />
          </Link>

          <div className="space-y-1.5 pt-1">
            <p className="truncate text-xs text-[#FCFBF8]/65">{adminEmail}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={signingOut}
              onClick={handleSignOut}
              className="w-full justify-start px-2 text-xs text-[#FCFBF8]/75 hover:bg-white/[0.08] hover:text-[#FCFBF8]"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              {signingOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#E3DFD6] bg-[#FCFBF8]/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1F4E37] text-[#FCFBF8] lg:hidden">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="truncate font-display text-sm font-medium text-[#14221B] lg:hidden">
                Operations Desk
              </span>

              <div className="hidden items-center gap-2 text-xs text-[#55635C] lg:flex">
                <span>Operations</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-[#14221B]">
                  {TAB_LABELS[activeTab]}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {totalActionItems > 0 ? (
                <button
                  type="button"
                  onClick={() => onTabChange?.("queue")}
                  className="hidden items-center gap-1.5 rounded-md border border-[#F59E0B]/40 bg-[#FFFBEB] px-2.5 py-1 text-xs font-medium text-[#92400E] tabular-nums transition-colors hover:bg-[#FEF3C7] sm:inline-flex whitespace-nowrap"
                >
                  <span>{totalActionItems} undone</span>
                </button>
              ) : (
                <span className="hidden items-center gap-1.5 rounded-md border border-[#1F4E37]/25 bg-[#1F4E37]/10 px-2.5 py-1 text-xs font-medium text-[#1F4E37] sm:inline-flex whitespace-nowrap">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All caught up</span>
                </span>
              )}

              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#E3DFD6] bg-[#FCFBF8] px-3 text-xs font-medium text-[#14221B] transition-colors hover:bg-[#F7F5F0] whitespace-nowrap"
              >
                <span>View store</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#55635C]" />
              </Link>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={signingOut}
                onClick={handleSignOut}
                className="min-h-9 px-2.5 text-xs text-[#55635C] hover:text-destructive lg:hidden"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Horizontal Tab Switcher (compact single row) */}
          <nav
            aria-label="Admin sections"
            className="grid grid-cols-3 gap-1 border-t border-[#E3DFD6] bg-[#FCFBF8] px-2 py-1.5 lg:hidden"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              const mobileItemClass = cn(
                "flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-[#1F4E37] text-[#FCFBF8]"
                  : "text-[#55635C] hover:bg-[#F7F5F0] hover:text-[#14221B]"
              );

              const inner = (
                <>
                  <item.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.key === "queue" ? "Queue" : item.label}</span>
                  {item.count !== undefined ? (
                    <span
                      className={cn(
                        "text-[11px] font-semibold tabular-nums",
                        isActive
                          ? "text-[#FCFBF8]/90"
                          : item.urgent
                            ? "text-[#B45309]"
                            : "text-[#55635C]"
                      )}
                    >
                      ({item.count})
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
