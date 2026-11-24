import { Skeleton } from "@/components/ui/skeleton";

export default function Admin2OrdersLoading() {
  return (
    <main className="space-y-6 p-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
