import Link from "next/link";
import { Leaf, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Leaf className="h-6 w-6" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">
        Product unavailable
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        This product is currently out of stock or has been removed from our
        catalog.
      </p>

      <div className="mt-6">
        <Button asChild>
          <Link href="/products">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Explore all products
          </Link>
        </Button>
      </div>
    </section>
  );
}
