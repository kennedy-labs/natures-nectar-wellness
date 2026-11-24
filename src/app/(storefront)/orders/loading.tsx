import { CustomerOrdersSkeleton } from "@/components/skeletons/StorefrontSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      <div className="mt-8">
        <CustomerOrdersSkeleton />
      </div>
    </main>
  );
}
