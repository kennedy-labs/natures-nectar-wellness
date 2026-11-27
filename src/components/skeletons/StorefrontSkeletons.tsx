import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="space-y-2.5 p-5 pb-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      </div>

      <div className="space-y-1.5 px-5 pb-4 pt-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/60 px-5 py-3.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <section
      aria-label="Loading storefront"
      className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:gap-12 sm:px-6 sm:py-12 md:gap-16 md:py-14"
    >
      <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col justify-center space-y-6 lg:col-span-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2.5">
              <Skeleton className="h-10 w-full md:h-12" />
              <Skeleton className="h-10 w-4/5 md:h-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-40 rounded-md" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="lg:col-span-6">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl lg:h-full lg:min-h-[380px]" />
        </div>
      </div>

      <div className="grid gap-6 border-y border-border/80 py-8 md:grid-cols-3 md:gap-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>

        <ProductGridSkeleton count={6} />
      </div>
    </section>
  );
}

export function ProductsPageSkeleton() {
  return (
    <section
      aria-label="Loading products"
      className="mx-auto max-w-6xl px-4 py-10"
    >
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <ProductGridSkeleton count={6} />
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <section
      aria-label="Loading product details"
      className="mx-auto max-w-4xl px-4 py-10"
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((block) => (
              <div key={block} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-48 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function CategoriesPageSkeleton() {
  return (
    <section
      aria-label="Loading categories"
      className="mx-auto max-w-6xl px-4 py-10"
    >
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="space-y-3 rounded-lg border bg-card p-5">
            <Skeleton className="h-5 w-2/3" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CheckoutSummarySkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl border bg-card p-6">
      <Skeleton className="h-6 w-36" />

      <div className="mt-6 space-y-4">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="flex items-start justify-between gap-4 border-b pb-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <main
      aria-label="Loading checkout"
      className="mx-auto w-full max-w-6xl px-4 py-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {[1, 2, 3].map((section) => (
            <div
              key={section}
              className="space-y-4 rounded-xl border bg-card p-6"
            >
              <Skeleton className="h-6 w-40" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-md" />
        </div>

        <div>
          <CheckoutSummarySkeleton />
        </div>
      </div>
    </main>
  );
}

export function CustomerOrdersSkeleton() {
  return (
    <div aria-label="Loading orders" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Tinted header band skeleton */}
        <div className="flex flex-col justify-between gap-4 border-b border-border/70 bg-muted/35 px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Connected stepper skeleton */}
        <div className="border-b border-border/70 px-5 py-6 sm:px-7">
          <div className="hidden grid-cols-4 gap-3 sm:grid">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
          <div className="space-y-3 sm:hidden">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Open hairline-divided body skeleton */}
        <div className="grid divide-y divide-border/70 md:grid-cols-12 md:divide-x md:divide-y-0">
          <div className="space-y-4 p-5 sm:p-7 md:col-span-7">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-3">
              {[1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border/70 pt-4">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 bg-muted/20 p-5 sm:p-7 md:col-span-5">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3.5 w-44" />
              </div>
              <div className="space-y-2 border-t border-border/60 pt-4">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-48" />
        <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
          {[1, 2].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6"
            >
              <div className="flex items-center gap-3.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
