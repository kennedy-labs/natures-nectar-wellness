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
      ? "text-[#B45309]"
      : tone === "success"
        ? "text-[#1F4E37]"
        : "text-[#14221B]";

  const content = (
    <div
      className={cn(
        "flex h-full flex-col justify-between bg-[#FCFBF8] p-4 sm:p-5 transition-colors",
        grouped
          ? "hover:bg-[#F7F5F0]/80"
          : "rounded-xl border border-[#E3DFD6] hover:border-[#14221B]/25"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[#55635C]">{title}</p>
        {href || onClick ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-[#55635C]" />
        ) : null}
      </div>

      <div className="mt-2.5">
        <p
          className={cn(
            "font-display text-2xl font-medium tracking-tight tabular-nums sm:text-[1.75rem]",
            toneClass
          )}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-1 text-xs text-[#55635C] tabular-nums">{subtext}</p>
        ) : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1F4E37]/30"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1F4E37]/30"
      >
        {content}
      </Link>
    );
  }

  return content;
}
