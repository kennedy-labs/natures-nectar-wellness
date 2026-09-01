import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatKes } from "@/lib/format";
import { getProductBySlug } from "@/server/services/product.service";
import { getInventoryStatus, getInventoryStatusLabel } from "@/features/inventory/utils/inventory.utils";
import { getProductInquiryUrl } from "@/features/whatsapp/utils/whatsapp.utils";
import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  props: ProductPageProps
): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Product not found",
    };
  }

  return {
    title: `${product.name}`,
    description: product.benefits ?? product.description,
  };
}

export default async function ProductPage(props: ProductPageProps) {
  const params = await props.params;
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const inventoryStatus = getInventoryStatus(product.stockQuantity);
  const whatsappUrl = getProductInquiryUrl(product.name);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="aspect-[4/3] bg-muted">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={product.name}
                className="h-full w-full object-cover"
                src={product.image}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm font-medium text-muted-foreground">
                Nature&apos;s Nectar
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight">
                {product.name}
              </h1>
              {product.isFeatured ? (
                <Badge variant="secondary">Featured</Badge>
              ) : null}
              <Badge
                variant={
                  inventoryStatus === "OUT_OF_STOCK" ? "destructive" : "secondary"
                }
              >
                {getInventoryStatusLabel(inventoryStatus)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-2xl font-semibold">{formatKes(product.price)}</p>
            <p className="text-sm text-muted-foreground">
              {product.stockQuantity > 0
                ? `${product.stockQuantity} in stock`
                : "Currently out of stock"}
            </p>
          </div>

          <div className="space-y-4 text-sm">
            {product.benefits ? (
              <div>
                <h2 className="font-medium">Benefits</h2>
                <p className="mt-1 text-muted-foreground">{product.benefits}</p>
              </div>
            ) : null}

            {product.usageInstructions ? (
              <div>
                <h2 className="font-medium">Usage</h2>
                <p className="mt-1 text-muted-foreground">
                  {product.usageInstructions}
                </p>
              </div>
            ) : null}

            {product.ingredients ? (
              <div>
                <h2 className="font-medium">Ingredients</h2>
                <p className="mt-1 text-muted-foreground">
                  {product.ingredients}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                stockQuantity: product.stockQuantity,
                image: product.image,
              }}
            />

            {whatsappUrl ? (
              <Button asChild variant="outline">
                <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                  Ask about this on WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

