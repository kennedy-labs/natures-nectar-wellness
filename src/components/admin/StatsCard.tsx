import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtext?: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "warning" | "success";
  grouped?: boolean;
};

export function StatsCard({
  title,
  value,
  subtext,
  href,
  onClick,
  tone = "default",
  grouped = false,
}: StatsCardProps) {
  const toneClass =
    tone === "warning"
      ? "text-amber-700"
      : tone === "success"
        ? "text-primary"
        : "text-foreground";

  const content = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-white p-5 transition-colors",
        grouped
          ? "hover:bg-[#F6F7F5]/60"
          : "rounded-xl border border-border hover:border-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">
          {title}
        </p>
        {href || onClick ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-3">
        <p
          className={cn(
            "font-display text-2xl font-medium tracking-tight tabular-nums sm:text-[1.85rem]",
            toneClass
          )}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {subtext}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        {content}
      </Link>
    );
  }

  return content;
}
