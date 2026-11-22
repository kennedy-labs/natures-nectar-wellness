"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  FolderPlus,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminImageDropzone } from "@/features/admin/components/AdminImageDropzone";
import {
  createCategoryFromClient,
  deleteCategoryFromClient,
  getCategoriesForClient,
  updateCategoryFromClient,
} from "@/features/categories/services/category-client.service";
import type { Category } from "@/features/categories/types/category.types";
import { getInventoryStatus } from "@/features/inventory/utils/inventory.utils";
import {
  createProductFromClient,
  deleteProductFromClient,
  getAdminProductsForClient,
  updateProductFromClient,
} from "@/features/products/services/product-client.service";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";

type AdminCatalogManagerProps = {
  initialCategories: Category[];
  initialProducts: Product[];
};

type CatalogSection = "products" | "categories";
type ProductFilter = "all" | "active" | "missing_photo" | "low_stock" | "inactive";

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

function toCategoryForm(category: Category): CategoryFormState {
  return {
    name: category.name,
    description: category.description ?? "",
    image: category.image ?? "",
  };
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : undefined;
}

export function AdminCatalogManager({
  initialCategories,
  initialProducts,
}: AdminCatalogManagerProps) {
  const [section, setSection] = useState<CatalogSection>("products");
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);

  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");

  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);

  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (productFilter === "active" && !p.isActive) return false;
      if (productFilter === "inactive" && p.isActive) return false;
      if (productFilter === "missing_photo" && p.image) return false;
      if (
        productFilter === "low_stock" &&
        (!p.isActive || p.stockQuantity > 5)
      ) {
        return false;
      }

      if (!query) return true;
      const catName = categoryById.get(p.categoryId)?.name ?? "";
      return (
        p.name.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    });
  }, [products, productFilter, searchQuery, categoryById]);

  async function refreshCatalog() {
    const [nextCategories, nextProducts] = await Promise.all([
      getCategoriesForClient(),
      getAdminProductsForClient(),
    ]);
    setCategories(nextCategories);
    setProducts(nextProducts);
  }

  function openNewProductEditor() {
    setFeedback(null);
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories[0]?.id ?? "",
    });
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditProductEditor(product: Product) {
    setFeedback(null);
    setEditingProductId(product.id);
    setProductForm(toProductForm(product));
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProductEditor() {
    setIsProductEditorOpen(false);
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const trimmedImage = productForm.image.trim();
    const basePayload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      benefits: normalizeOptional(productForm.benefits),
      usageInstructions: normalizeOptional(productForm.usageInstructions),
      ingredients: normalizeOptional(productForm.ingredients),
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity),
      categoryId: productForm.categoryId,
      isFeatured: productForm.isFeatured,
      isActive: productForm.isActive,
    };

    try {
      if (editingProductId) {
        await updateProductFromClient(editingProductId, {
          ...basePayload,
          image: trimmedImage ? trimmedImage : null,
        });
      } else {
        await createProductFromClient({
          ...basePayload,
          image: trimmedImage ? trimmedImage : undefined,
        });
      }

      await refreshCatalog();
      const wasEdit = Boolean(editingProductId);
      closeProductEditor();
      setFeedback({
        type: "success",
        text: wasEdit
          ? "Product changes saved."
          : "New product added to catalog.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not save product. Check required fields.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivateProduct(product: Product) {
    setIsSaving(true);
    setFeedback(null);

    try {
      await deleteProductFromClient(product.id);
      await refreshCatalog();
      setFeedback({
        type: "success",
        text: `${product.name} marked inactive.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not deactivate product.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function openNewCategoryEditor() {
    setFeedback(null);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setIsCategoryEditorOpen(true);
  }

  function openEditCategoryEditor(category: Category) {
    setFeedback(null);
    setEditingCategoryId(category.id);
    setCategoryForm(toCategoryForm(category));
    setIsCategoryEditorOpen(true);
  }

  function closeCategoryEditor() {
    setIsCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const trimmedImage = categoryForm.image.trim();

    try {
      if (editingCategoryId) {
        await updateCategoryFromClient(editingCategoryId, {
          name: categoryForm.name.trim(),
          description: normalizeOptional(categoryForm.description),
          image: trimmedImage ? trimmedImage : null,
        });
      } else {
        await createCategoryFromClient({
          name: categoryForm.name.trim(),
          description: normalizeOptional(categoryForm.description),
          image: trimmedImage ? trimmedImage : undefined,
        });
      }

      await refreshCatalog();
      const wasEdit = Boolean(editingCategoryId);
      closeCategoryEditor();
      setFeedback({
        type: "success",
        text: wasEdit ? "Category updated." : "Category created.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not save category.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory(category: Category) {
    setIsSaving(true);
    setFeedback(null);

    try {
      await deleteCategoryFromClient(category.id);
      await refreshCatalog();
      setFeedback({
        type: "success",
        text: `${category.name} deleted.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Category could not be deleted (move or remove its products first).",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Sub-section Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-grid grid-cols-2 rounded-lg border border-border/80 bg-white p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setSection("products");
              setFeedback(null);
            }}
            className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              section === "products"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSection("categories");
              setFeedback(null);
            }}
            className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              section === "categories"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {section === "products" && !isProductEditorOpen ? (
          <Button
            type="button"
            onClick={openNewProductEditor}
            disabled={categories.length === 0}
            className="min-h-11 w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add product
          </Button>
        ) : null}

        {section === "categories" && !isCategoryEditorOpen ? (
          <Button
            type="button"
            onClick={openNewCategoryEditor}
            className="min-h-11 w-full sm:w-auto"
          >
            <FolderPlus className="mr-1.5 h-4 w-4" />
            Add category
          </Button>
        ) : null}
      </div>

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {section === "products" ? (
        <div className="space-y-5">
          {isProductEditorOpen ? (
            <div className="rounded-xl border border-border/80 bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingProductId ? "Edit product" : "Create new product"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Upload a clear photo and enter Kenyan Shilling (KES)
                    pricing.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10"
                  onClick={closeProductEditor}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to products
                </Button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <AdminImageDropzone
                  id="product-image-upload"
                  label="Product photo"
                  value={productForm.image}
                  onChange={(nextImage) =>
                    setProductForm((prev) => ({ ...prev, image: nextImage }))
                  }
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-name"
                      className="text-sm font-medium"
                    >
                      Product name *
                    </label>
                    <Input
                      id="product-name"
                      className="h-11"
                      placeholder="e.g. Raw Mau Forest Honey (500g)"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-category"
                      className="text-sm font-medium"
                    >
                      Category *
                    </label>
                    <select
                      id="product-category"
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={productForm.categoryId}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-price"
                      className="text-sm font-medium"
                    >
                      Price (KES) *
                    </label>
                    <Input
                      id="product-price"
                      className="h-11 tabular-nums"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-stock"
                      className="text-sm font-medium"
                    >
                      Stock quantity *
                    </label>
                    <Input
                      id="product-stock"
                      className="h-11 tabular-nums"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 25"
                      value={productForm.stockQuantity}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          stockQuantity: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="product-description"
                    className="text-sm font-medium"
                  >
                    Description *
                  </label>
                  <Textarea
                    id="product-description"
                    rows={3}
                    placeholder="Describe the product clearly for shoppers..."
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="product-benefits"
                      className="text-sm font-medium"
                    >
                      Wellness benefits (optional)
                    </label>
                    <Textarea
                      id="product-benefits"
                      rows={2}
                      placeholder="Key wellness benefits..."
                      value={productForm.benefits}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          benefits: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-usage"
                      className="text-sm font-medium"
                    >
                      Usage instructions (optional)
                    </label>
                    <Textarea
                      id="product-usage"
                      rows={2}
                      placeholder="Recommended daily usage..."
                      value={productForm.usageInstructions}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          usageInstructions: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-ingredients"
                      className="text-sm font-medium"
                    >
                      Ingredients (optional)
                    </label>
                    <Textarea
                      id="product-ingredients"
                      rows={2}
                      placeholder="100% pure organic..."
                      value={productForm.ingredients}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          ingredients: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 rounded-lg border border-border/70 bg-muted/20 p-4">
                  <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Visible in storefront
                  </label>

                  <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          isFeatured: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    Featured product
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={closeProductEditor}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || categories.length === 0}
                    className="min-h-11 sm:min-w-[160px]"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingProductId
                        ? "Save changes"
                        : "Create product"}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Search & Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-10 pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "missing_photo", label: "No photo" },
                  { key: "low_stock", label: "Low stock" },
                  { key: "inactive", label: "Archived" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setProductFilter(tab.key)}
                  className={`min-h-9 rounded-md px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                    productFilter === tab.key
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-white p-8 text-center">
              <p className="text-sm font-medium">Create a category first</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add at least one category before creating products.
              </p>
              <Button
                type="button"
                className="mt-4 min-h-10"
                onClick={() => {
                  setSection("categories");
                  openNewCategoryEditor();
                }}
              >
                Create category
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-white p-8 text-center text-sm text-muted-foreground">
              No products match the current search or filter.
            </div>
          ) : (
            <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-white">
              {filteredProducts.map((product) => {
                const status = getInventoryStatus(product.stockQuantity);
                const category = categoryById.get(product.categoryId);

                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="truncate font-semibold text-foreground">
                            {product.name}
                          </h3>
                          {!product.isActive ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              · Archived
                            </span>
                          ) : null}
                          {!product.image ? (
                            <span className="text-xs font-medium text-amber-700">
                              · Needs photo
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-muted-foreground tabular-nums">
                          {category?.name ?? "Uncategorized"}
                          <span aria-hidden="true"> · </span>
                          <span className="font-semibold text-foreground">
                            {formatKes(product.price)}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span
                            className={
                              status === "OUT_OF_STOCK"
                                ? "font-medium text-destructive"
                                : status === "LOW_STOCK"
                                  ? "font-medium text-amber-700"
                                  : ""
                            }
                          >
                            {product.stockQuantity} in stock
                          </span>
                        </p>

                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10 flex-1 sm:flex-initial"
                        onClick={() => openEditProductEditor(product)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={isSaving || !product.isActive}
                        aria-label={`Archive ${product.name}`}
                        onClick={() => handleDeactivateProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {isCategoryEditorOpen ? (
            <div className="rounded-xl border border-border/80 bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingCategoryId
                      ? "Edit category"
                      : "Create new category"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Organize your storefront and upload an optional category
                    photo.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10"
                  onClick={closeCategoryEditor}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-5">
                <AdminImageDropzone
                  id="category-image-upload"
                  label="Category photo (optional)"
                  value={categoryForm.image}
                  onChange={(nextImage) =>
                    setCategoryForm((prev) => ({ ...prev, image: nextImage }))
                  }
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="category-name"
                    className="text-sm font-medium"
                  >
                    Category name *
                  </label>
                  <Input
                    id="category-name"
                    className="h-11"
                    placeholder="e.g. Herbal Teas"
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="category-description"
                    className="text-sm font-medium"
                  >
                    Description (optional)
                  </label>
                  <Textarea
                    id="category-description"
                    rows={2}
                    placeholder="Short category summary for shoppers..."
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={closeCategoryEditor}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-h-11 sm:min-w-[150px]"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingCategoryId
                        ? "Save category"
                        : "Create category"}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {categories.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-white p-8 text-center text-sm text-muted-foreground">
              No categories yet. Add your first category above.
            </div>
          ) : (
            <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-white">
              {categories.map((category) => {
                const count = productCountByCategory.get(category.id) ?? 0;

                return (
                  <div
                    key={category.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                        {category.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.image}
                            alt={category.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">
                          {category.name}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground tabular-nums">
                          /{category.slug} · {count} product
                          {count === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10 flex-1 sm:flex-initial"
                        onClick={() => openEditCategoryEditor(category)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        disabled={isSaving}
                        aria-label={`Delete ${category.name}`}
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}