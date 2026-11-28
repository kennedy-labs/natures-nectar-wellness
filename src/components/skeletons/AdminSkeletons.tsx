import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div
      aria-label="Loading admin dashboard"
      className="min-h-screen bg-[#F6F7F5] text-foreground"
    >
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border/80 lg:bg-white">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex-1 space-y-2 p-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-11 w-full rounded-lg" />
          ))}
        </div>
        <div className="space-y-3 border-t border-border/70 p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border/60 bg-white px-2 py-1.5 lg:hidden">
            {[1, 2, 3].map((tab) => (
              <Skeleton key={tab} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </div>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <div
                key={card}
                className="space-y-3 rounded-xl border border-border/80 bg-white p-4"
              >
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((panel) => (
              <div
                key={panel}
                className="space-y-4 rounded-xl border border-border/80 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="divide-y divide-border/60">
                  {[1, 2, 3, 4].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

export function AdminOrdersListSkeleton() {
  return (
    <div aria-label="Loading admin orders" className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4 xl:grid-cols-7">
        {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
          <div
            key={cell}
            className="flex flex-col justify-between gap-2 bg-white px-3.5 py-3"
          >
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-9" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-3 sm:p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-hidden">
          {[1, 2, 3, 4, 5].map((tab) => (
            <Skeleton key={tab} className="h-9 w-24 shrink-0 rounded-md" />
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full rounded-md sm:w-64" />
          <div className="flex gap-1.5">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="divide-y divide-border/80">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8.5 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminPaymentsSkeleton() {
  return (
    <div aria-label="Loading payments" className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="space-y-2 rounded-md border bg-white p-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-24" />
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminLoginSkeleton() {
  return (
    <main
      aria-label="Loading sign in"
      className="flex min-h-screen items-center justify-center bg-[#F6F7F5] px-4 py-10 sm:px-6"
    >
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-12">
        <div className="space-y-6 bg-[#1F4E37] p-7 sm:p-10 lg:col-span-5">
          <Skeleton className="h-9 w-9 rounded-md bg-white/15" />
          <div className="space-y-2.5">
            <Skeleton className="h-7 w-48 bg-white/15" />
            <Skeleton className="h-4 w-full bg-white/10" />
            <Skeleton className="h-4 w-4/5 bg-white/10" />
          </div>
        </div>
        <div className="space-y-6 p-6 sm:p-10 lg:col-span-7">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>
    </main>
  );
}
