"use client";

import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { formatKes } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Category } from "@/features/categories/types/category.types";
import {
  createCategoryFromClient,
  deleteCategoryFromClient,
  getCategoriesForClient,
} from "@/features/categories/services/category-client.service";
import { getInventoryStatusLabel } from "@/features/inventory/utils/inventory.utils";
import { getInventoryStatus } from "@/features/inventory/utils/inventory.utils";
import { Product } from "@/features/products/types/product.types";
import {
  createProductFromClient,
  deleteProductFromClient,
  getAdminProductsForClient,
  updateProductFromClient,
} from "@/features/products/services/product-client.service";

import { AdminOrdersPanel } from "@/features/admin/components/AdminOrdersPanel";

type AdminCatalogManagerProps = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CategoryFormState = {
  name: string;
  description: string;
  image: string;
};

type ProductFormState = {
  name: string;
  description: string;
  benefits: string;
  usageInstructions: string;
  ingredients: string;
  price: string;
  stockQuantity: string;
  image: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  description: "",
  image: "",
};

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  benefits: "",
  usageInstructions: "",
  ingredients: "",
  price: "",
  stockQuantity: "0",
  image: "",
  categoryId: "",
  isFeatured: false,
  isActive: true,
};

function toProductForm(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    benefits: product.benefits ?? "",
    usageInstructions: product.usageInstructions ?? "",
    ingredients: product.ingredients ?? "",
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
    image: product.image ?? "",
    categoryId: product.categoryId,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : undefined;
}

export function AdminCatalogManager({
  initialCategories,
  initialProducts,
}: AdminCatalogManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  async function refreshCatalog() {
    const [nextCategories, nextProducts] = await Promise.all([
      getCategoriesForClient(),
      getAdminProductsForClient(),
    ]);

    setCategories(nextCategories);
    setProducts(nextProducts);
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      await createCategoryFromClient({
        name: categoryForm.name,
        description: normalizeOptional(categoryForm.description),
        image: normalizeOptional(categoryForm.image),
      });
      setCategoryForm(emptyCategoryForm);
      await refreshCatalog();
      setMessage("Category saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Category failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setIsSaving(true);
    setMessage(null);

    try {
      await deleteCategoryFromClient(id);
      await refreshCatalog();
      setMessage("Category deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Category could not be deleted."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      name: productForm.name,
      description: productForm.description,
      benefits: normalizeOptional(productForm.benefits),
      usageInstructions: normalizeOptional(productForm.usageInstructions),
      ingredients: normalizeOptional(productForm.ingredients),
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity),
      image: normalizeOptional(productForm.image),
      categoryId: productForm.categoryId,
      isFeatured: productForm.isFeatured,
      isActive: productForm.isActive,
    };

    try {
      if (editingProductId) {
        await updateProductFromClient(editingProductId, payload);
      } else {
        await createProductFromClient(payload);
      }

      setProductForm(emptyProductForm);
      setEditingProductId(null);
      await refreshCatalog();
      setMessage(editingProductId ? "Product updated." : "Product created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    setIsSaving(true);
    setMessage(null);

    try {
      await deleteProductFromClient(id);
      await refreshCatalog();
      setMessage("Product deactivated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditingProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm(toProductForm(product));
    setMessage(null);
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={handleCreateCategory}>
                <Input
                  placeholder="Category name"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Image URL"
                  value={categoryForm.image}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      image: event.target.value,
                    }))
                  }
                />
                <Button className="w-full" disabled={isSaving} type="submit">
                  <Plus />
                  Add category
                </Button>
              </form>

              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                    key={category.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {category.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {category.slug}
                      </p>
                    </div>
                    <Button
                      aria-label={`Delete ${category.name}`}
                      disabled={isSaving}
                      onClick={() => handleDeleteCategory(category.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {message ? (
            <p className="rounded-md border bg-card px-3 py-2 text-sm">
              {message}
            </p>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>
                  {editingProductId ? "Edit product" : "Create product"}
                </CardTitle>
                {editingProductId ? (
                  <Button onClick={resetProductForm} type="button" variant="ghost">
                    <RotateCcw />
                    New product
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={handleSaveProduct}
              >
                <Input
                  className="md:col-span-1"
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />

                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={productForm.categoryId}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <Textarea
                  className="md:col-span-2"
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  required
                />

                <Textarea
                  className="md:col-span-2"
                  placeholder="Benefits"
                  value={productForm.benefits}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      benefits: event.target.value,
                    }))
                  }
                />

                <Textarea
                  placeholder="Usage instructions"
                  value={productForm.usageInstructions}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      usageInstructions: event.target.value,
                    }))
                  }
                />

                <Textarea
                  placeholder="Ingredients"
                  value={productForm.ingredients}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      ingredients: event.target.value,
                    }))
                  }
                />

                <Input
                  min="0"
                  placeholder="Price"
                  step="0.01"
                  type="number"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  required
                />

                <Input
                  min="0"
                  placeholder="Stock quantity"
                  type="number"
                  value={productForm.stockQuantity}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      stockQuantity: event.target.value,
                    }))
                  }
                  required
                />

                <Input
                  className="md:col-span-2"
                  placeholder="Image URL"
                  value={productForm.image}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      image: event.target.value,
                    }))
                  }
                />

                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={productForm.isFeatured}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        isFeatured: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Featured
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    checked={productForm.isActive}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Active
                </label>

                <Button
                  className="md:col-span-2"
                  disabled={isSaving || categories.length === 0}
                  type="submit"
                >
                  <Save />
                  {editingProductId ? "Save changes" : "Create product"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {products.map((product) => {
              const status = getInventoryStatus(product.stockQuantity);
              const category = categoryById.get(product.categoryId);

              return (
                <div
                  className="grid gap-3 rounded-lg border bg-card p-4 text-card-foreground md:grid-cols-[minmax(0,1fr)_auto]"
                  key={product.id}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{product.name}</h3>
                      <Badge variant={product.isActive ? "secondary" : "outline"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        variant={
                          status === "OUT_OF_STOCK" ? "destructive" : "secondary"
                        }
                      >
                        {status === "LOW_STOCK"
                         ? "⚠️ LOW STOCK"
                         : getInventoryStatusLabel(status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category?.name ?? "Uncategorized"} · {formatKes(product.price)} ·{" "}
                      {product.stockQuantity} units
                    </p>
                    <p className="line-clamp-2 text-sm">{product.description}</p>
                  </div>

                  <div className="flex gap-2 md:items-start">
                    <Button
                      onClick={() => startEditingProduct(product)}
                      type="button"
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      disabled={isSaving || !product.isActive}
                      onClick={() => handleDeleteProduct(product.id)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Orders</h2>
        <AdminOrdersPanel />
      </div>
    </div>
  );
}