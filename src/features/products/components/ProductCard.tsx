import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { formatKes } from "@/lib/format";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";

type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  description: string;
  benefits?: string | null;
  price: number;
  stockQuantity: number;
  image?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
  priority?: boolean;
};

export function ProductCard({
  id,
  slug,
  name,
  description,
  benefits,
  price,
  stockQuantity,
  image,
  categoryName,
  isFeatured = false,
  priority = false,
}: ProductCardProps) {
  const isOutOfStock = stockQuantity <= 0;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_24px_-10px_rgba(26,66,45,0.14)]">
      {/* 1:1 Fixed Aspect Ratio Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              referrerPolicy="no-referrer"
              unoptimized={
                image.startsWith("/api/media/") || image.startsWith("data:")
              }
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/70 to-secondary/60 p-4 text-center">
              <Leaf className="h-6 w-6 text-primary/50" />
              <span className="font-display text-xs font-medium text-muted-foreground">
                Nature&apos;s Nectar
              </span>
            </div>
          )}
        </Link>

        {/* Optional Top-Left Badge */}
        <div className="pointer-events-none absolute top-2 left-2 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="rounded bg-destructive/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground shadow-xs">
              Sold out
            </span>
          ) : isFeatured ? (
            <span className="rounded bg-primary/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-xs">
              Best Seller
            </span>
          ) : stockQuantity <= 5 ? (
            <span className="rounded bg-amber-600/95 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-xs">
              Only {stockQuantity} left
            </span>
          ) : (
            <span className="rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-xs backdrop-blur-xs">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
          {categoryName || "Botanical Formulation"}
        </p>

        <Link href={`/products/${slug}`} className="mt-1 block">
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-base">
            {name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {benefits || description}
        </p>

        {/* Price + Quick Add */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
            {formatKes(price)}
          </span>

          <AddToCartButton
            product={{
              id,
              name,
              price,
              slug,
              stockQuantity,
              image,
            }}
          />
        </div>
      </div>
    </div>
  );
}