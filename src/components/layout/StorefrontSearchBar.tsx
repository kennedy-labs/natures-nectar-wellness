"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { InlineBotanicalSearch } from "@/components/layout/InlineBotanicalSearch";

function SyncedSubbarSearch() {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q")?.trim() ?? "";

  return (
    <InlineBotanicalSearch
      key={currentQuery}
      variant="subbar"
      initialQuery={currentQuery}
      placeholder="Search raw honey, shilajit, herbal teas..."
      className="mx-auto max-w-2xl"
    />
  );
}

export function StorefrontSearchBar() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <div className="border-b border-border/60 bg-muted/25">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <Suspense
          fallback={
            <InlineBotanicalSearch
              variant="subbar"
              placeholder="Search raw honey, shilajit, herbal teas..."
              className="mx-auto max-w-2xl"
            />
          }
        >
          <SyncedSubbarSearch />
        </Suspense>
      </div>
    </div>
  );
}
