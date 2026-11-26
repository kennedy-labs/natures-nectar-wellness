import { formatKes } from "@/lib/format";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
import { AddToCartButton } from "@/features/products/components/AddToCartButton";
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
  const hasDistinctBenefits =
    Boolean(trimmedBenefits) &&
    trimmedBenefits.toLowerCase() !== trimmedDescription.toLowerCase();

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl border-border/80 bg-card shadow-[0_1px_2px_rgba(24,42,32,0.04)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-[0_14px_30px_-14px_rgba(24,42,32,0.16)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
        {image ? (
          <SkeletonImage
            src={image}
            alt={name}
            priority={priority}
            useNextImage={!image.startsWith("data:")}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-display text-sm font-medium text-muted-foreground">
            Nature&apos;s Nectar
          </div>
        )}
      </div>

      <CardHeader className="space-y-2 p-5 pb-2">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
          {categoryName ? (
            <>
              <span className="truncate font-medium text-muted-foreground">
                {categoryName}
              </span>
              <span aria-hidden="true" className="text-muted-foreground/70">
                ·
              </span>
            </>
          ) : null}
          <span
            className={cn(
              "font-medium",
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

        <CardTitle className="font-display text-xl font-medium leading-snug tracking-tight text-foreground text-balance">
          {name}
        </CardTitle>

        {hasDistinctBenefits ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {trimmedBenefits}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="px-5 pb-4 pt-1">
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground/90",
            hasDistinctBenefits ? "line-clamp-2" : "line-clamp-3"
          )}
        >
          {description}
        </p>
      </CardContent>

      <CardFooter className="mt-auto border-t border-border/60 px-5 py-3.5">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
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
      </CardFooter>
    </Card>
  );
}