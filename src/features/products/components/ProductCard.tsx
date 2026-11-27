import { Leaf } from "lucide-react";

import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  description: string;
  benefits?: string | null;
  categoryName?: string | null;
  price: number;
  stockQuantity: number;
  image?: string | null;
  priority?: boolean;
};

export function ProductCard({
  id,
  slug,
  name,
  description,
  benefits,
  categoryName,
  price,
  stockQuantity,
  image,
  priority = false,
}: ProductCardProps) {
  const inventoryStatus = getInventoryStatus(stockQuantity);
  const statusLabel = getInventoryStatusLabel(inventoryStatus);
  const trimmedBenefits = benefits?.trim() || "";
  const trimmedDescription = description.trim();
  const summaryText =
    trimmedBenefits &&
    trimmedBenefits.toLowerCase() !== trimmedDescription.toLowerCase()
      ? trimmedBenefits
      : trimmedDescription;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,border-color,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-[0_14px_28px_-16px_rgba(20,34,27,0.14)]">
      {/* Visual Surface (4:3 locked ratio) */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-muted/45">
        {image ? (
          <SkeletonImage
            src={image}
            alt={name}
            priority={priority}
            useNextImage={!image.startsWith("data:")}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_top,rgba(31,78,55,0.08),transparent_70%)] px-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary/75">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-display text-xs font-medium tracking-wide text-muted-foreground">
              Nature&apos;s Nectar
            </span>
          </div>
        )}
      </div>

      {/* Uniform Text Slot Cadence */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-xs">
          {categoryName ? (
            <>
              <span className="truncate font-medium text-muted-foreground">
                {categoryName}
              </span>
              <span aria-hidden="true" className="text-muted-foreground/60">
                ·
              </span>
            </>
          ) : null}
          <span
            className={cn(
              "shrink-0 font-medium",
              inventoryStatus === "OUT_OF_STOCK"
                ? "text-destructive"
                : inventoryStatus === "LOW_STOCK"
                  ? "text-amber-700"
                  : "text-primary"
            )}
          >
            {statusLabel}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-display text-[19px] font-medium leading-[1.28] tracking-tight text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {summaryText}
        </p>

        {/* Hairline Price + CTA Footer aligned horizontally across grid */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/75 pt-4 mt-5">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {formatKes(price)}
          </p>

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
    </article>
  );
}