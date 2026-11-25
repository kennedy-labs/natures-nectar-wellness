import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(24,42,32,0.04)]"
    >
      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="space-y-2 p-3 pb-2 sm:p-4 sm:pb-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="hidden h-3.5 w-full sm:block" />
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-border/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-full rounded-md sm:w-20" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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

        <ProductGridSkeleton count={8} />
      </div>
    </section>
  );
}

export function ProductsPageSkeleton() {
  return (
    <section
      aria-label="Loading products"
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
    >
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <ProductGridSkeleton count={8} />
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
          <Skeleton className="aspect-square w-full rounded-none" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-20 rounded-full" />
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
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
    >
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="aspect-[4/3] w-full rounded-xl" />
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
    <div aria-label="Loading orders" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="space-y-3">
        {/* First card expanded skeleton */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-5 border-t bg-muted/20 p-4 sm:p-5">
            <div className="space-y-2.5">
              <Skeleton className="h-3.5 w-36" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map((step) => (
                  <Skeleton key={step} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border bg-background p-4">
                <Skeleton className="h-3.5 w-28" />
                <div className="space-y-3">
                  {[1, 2].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t pt-2.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-4">
                <div className="space-y-3">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Second collapsed card skeleton */}
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
