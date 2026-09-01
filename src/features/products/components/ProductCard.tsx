import { formatKes } from "@/lib/format";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getInventoryStatus,
  getInventoryStatusLabel,
} from "@/features/inventory/utils/inventory.utils";
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
}: ProductCardProps) {
  const inventoryStatus = getInventoryStatus(stockQuantity);

  return (
    <Card className="h-full overflow-hidden rounded-lg shadow-sm">
      <div className="aspect-[4/3] bg-muted relative">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-muted-foreground">
            Nature&apos;s Nectar
          </div>
        )}
      </div>

      <CardHeader className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-snug">{name}</CardTitle>

          <Badge
            variant={
              inventoryStatus === "OUT_OF_STOCK"
                ? "destructive"
                : "secondary"
            }
          >
            {getInventoryStatusLabel(inventoryStatus)}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {benefits ?? description}
        </p>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>

      <CardFooter className="flex items-center justify-between px-4 pb-4 pt-0">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold">{formatKes(price)}</p>

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