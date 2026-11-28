import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div
      aria-label="Loading admin operations desk"
      className="min-h-screen bg-[#F7F5F0] text-[#14221B]"
    >
      {/* Desktop Deep Pine Sidebar Skeleton */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#14221B]/10 lg:bg-[#14221B]">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <Skeleton className="h-8 w-8 rounded-md bg-white/15" />
          <Skeleton className="h-4 w-28 bg-white/15" />
        </div>
        <div className="flex-1 space-y-2 p-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-11 w-full rounded-lg bg-white/10" />
          ))}
        </div>
        <div className="space-y-3 border-t border-white/10 p-4">
          <Skeleton className="h-10 w-full rounded-lg bg-white/10" />
          <Skeleton className="h-3.5 w-3/4 bg-white/10" />
          <Skeleton className="h-8 w-24 rounded-md bg-white/10" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#E3DFD6] bg-[#FCFBF8]/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <Skeleton className="h-5 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-[#E3DFD6] bg-[#FCFBF8] px-2 py-1.5 lg:hidden">
            {[1, 2, 3].map((tab) => (
              <Skeleton key={tab} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:py-8">
          <div className="flex flex-col gap-3 border-b border-[#E3DFD6] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>

          <section className="space-y-2.5">
            <Skeleton className="h-4 w-44" />
            <div className="divide-y divide-[#E3DFD6] overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8]">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3.5 w-72 max-w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-24 rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#E3DFD6] lg:grid-cols-4">
            {[1, 2, 3, 4].map((card) => (
              <div key={card} className="space-y-3 bg-[#FCFBF8] p-4 sm:p-5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
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
      <div className="space-y-3 rounded-xl border border-[#E3DFD6] bg-[#FCFBF8] p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Skeleton className="h-9 w-full rounded-md sm:w-56" />
            <div className="flex gap-1.5">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#E3DFD6] pt-3 lg:grid-cols-[2fr_1fr]">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3DFD6] bg-[#E3DFD6] sm:grid-cols-4">
            {[1, 2, 3, 4].map((cell) => (
              <div key={cell} className="space-y-2 bg-[#FCFBF8] px-3 py-2.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E3DFD6] bg-[#E3DFD6]">
            {[1, 2].map((cell) => (
              <div key={cell} className="space-y-2 bg-[#FCFBF8] px-3 py-2.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8]">
        <div className="divide-y divide-[#E3DFD6]">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
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
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
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
        <div key={item} className="space-y-2 rounded-md border border-[#E3DFD6] bg-[#FCFBF8] p-3">
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
      className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-4 py-10 sm:px-6"
    >
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-[#E3DFD6] bg-[#FCFBF8] lg:grid-cols-12">
        <div className="space-y-6 bg-[#14221B] p-7 sm:p-10 lg:col-span-5">
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
