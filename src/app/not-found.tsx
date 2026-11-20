import Link from "next/link";
import { ArrowLeft, Leaf, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Leaf className="h-7 w-7" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        404 — Page not found
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>

      <p className="mt-3 text-sm text-muted-foreground">
        The product or page you requested may have moved or is no longer
        available. Browse our current herbal supplements, teas, and wellness
        collection below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/products">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Browse products
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  );
}
