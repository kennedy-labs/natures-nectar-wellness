import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  subtext?: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "warning" | "success";
};

export function StatsCard({
  title,
  value,
  subtext,
  href,
  onClick,
  tone = "default",
}: StatsCardProps) {
  const toneClass =
    tone === "warning"
      ? "text-amber-700"
      : tone === "success"
        ? "text-emerald-700"
        : "text-foreground";

  const content = (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border/80 bg-white p-5 transition-colors hover:border-border">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {href || onClick ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-3">
        <p
          className={`text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${toneClass}`}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
        ) : null}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full w-full text-left focus-visible:outline-none"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
