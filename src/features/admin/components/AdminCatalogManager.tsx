"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArchiveRestore,
  ArrowLeft,
  FolderPlus,
  ImageOff,
  Images,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminBulkDraftUploader } from "@/features/admin/components/AdminBulkDraftUploader";
import { AdminImageDropzone } from "@/features/admin/components/AdminImageDropzone";
import { AdminProductActionDialog } from "@/features/admin/components/AdminProductActionDialog";
import {
  createCategoryFromClient,
  deleteCategoryFromClient,
  updateCategoryFromClient,
} from "@/features/categories/services/category-client.service";
import type { Category } from "@/features/categories/types/category.types";
import { getInventoryStatus } from "@/features/inventory/utils/inventory.utils";
import {
  createProductFromClient,
  deleteProductFromClient,
  permanentlyDeleteProductFromClient,
  updateProductFromClient,
} from "@/features/products/services/product-client.service";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";
import { ApiClientError } from "@/lib/api-client";

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

function isValidImageReference(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    value.startsWith("data:image/")
  );
}

type FieldErrors = Record<string, string>;

function extractErrorFeedback(error: unknown, fallbackMessage: string): {
  summary: string;
  details: string[];
  fieldErrors: FieldErrors;
} {
  if (error instanceof ApiClientError) {
    const fieldErrors: FieldErrors = {};
    const details: string[] = [];

    if (error.issues && error.issues.length > 0) {
      for (const issue of error.issues) {
        const key = typeof issue.path[0] === "string" ? issue.path[0] : "form";
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
        if (!details.includes(issue.message)) {
          details.push(issue.message);
        }
      }
    }

    return {
      summary:
        details.length > 0
          ? "Please fix the highlighted fields below:"
          : error.message,
      details,
      fieldErrors,
    };
  }

  return {
    summary: error instanceof Error ? error.message : fallbackMessage,
    details: [],
    fieldErrors: {},
  };
}

function validateProductForm(form: ProductFormState): FieldErrors {
  const errors: FieldErrors = {};
  const name = form.name.trim();
  const description = form.description.trim();
  const benefits = form.benefits.trim();
  const usageInstructions = form.usageInstructions.trim();
  const ingredients = form.ingredients.trim();
  const trimmedImage = form.image.trim();
  const price = Number(form.price);
  const stock = Number(form.stockQuantity);

  if (name.length < 3) {
    errors.name = "Product name must be at least 3 characters.";
  }

  if (!form.categoryId) {
    errors.categoryId = "Please select a category.";
  }

  if (!form.price.trim() || !Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a valid price greater than KES 0.";
  }

  if (
    form.stockQuantity.trim() === "" ||
    !Number.isFinite(stock) ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    errors.stockQuantity = "Stock quantity must be a whole number (0 or more).";
  }

  if (description.length < 5) {
    errors.description = "Description must be at least 5 characters.";
  }

  if (benefits && benefits.length < 2) {
    errors.benefits = "Wellness benefits must be at least 2 characters if filled in.";
  }

  if (usageInstructions && usageInstructions.length < 2) {
    errors.usageInstructions =
      "Usage instructions must be at least 2 characters if filled in.";
  }

  if (ingredients && ingredients.length < 2) {
    errors.ingredients = "Ingredients must be at least 2 characters if filled in.";
  }

  if (trimmedImage && !isValidImageReference(trimmedImage)) {
    errors.image =
      "Photo must be an uploaded image, an https:// URL, or a /images/ path.";
  }

  return errors;
}

function validateCategoryForm(form: CategoryFormState): FieldErrors {
  const errors: FieldErrors = {};
  const name = form.name.trim();
  const description = form.description.trim();
  const trimmedImage = form.image.trim();

  if (name.length < 2) {
    errors.name = "Category name must be at least 2 characters.";
  }

  if (description && description.length < 3) {
    errors.description =
      "Category description must be at least 3 characters if filled in.";
  }

  if (trimmedImage && !isValidImageReference(trimmedImage)) {
    errors.image =
      "Photo must be an uploaded image, an https:// URL, or a /images/ path.";
  }

  return errors;
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
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [productFieldErrors, setProductFieldErrors] = useState<FieldErrors>({});

  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(emptyCategoryForm);
  const [categoryFieldErrors, setCategoryFieldErrors] = useState<FieldErrors>(
    {}
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [actionProduct, setActionProduct] = useState<Product | null>(null);
  const [pressingProductId, setPressingProductId] = useState<string | null>(
    null
  );
  const longPressTimerRef = useRef<number | null>(null);
  const pressOriginRef = useRef<{ x: number; y: number } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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

  const filterCounts = useMemo(() => {
    let active = 0;
    let missingPhoto = 0;
    let lowStock = 0;
    let inactive = 0;

    for (const p of products) {
      if (p.isActive) {
        active += 1;
        if (p.stockQuantity <= 5) {
          lowStock += 1;
        }
      } else {
        inactive += 1;
      }
      if (!p.image) {
        missingPhoto += 1;
      }
    }

    return {
      all: products.length,
      active,
      missing_photo: missingPhoto,
      low_stock: lowStock,
      inactive,
    };
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

  function clearProductFieldError(field: string) {
    setProductFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function clearCategoryFieldError(field: string) {
    setCategoryFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function openNewProductEditor() {
    setFeedback(null);
    setProductFieldErrors({});
    setIsBulkUploadOpen(false);
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories[0]?.id ?? "",
    });
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openBulkUploadPanel() {
    setFeedback(null);
    setIsProductEditorOpen(false);
    setEditingProductId(null);
    setIsBulkUploadOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEditProductEditor(product: Product) {
    setFeedback(null);
    setProductFieldErrors({});
    setIsBulkUploadOpen(false);
    setEditingProductId(product.id);
    setProductForm(toProductForm(product));
    setIsProductEditorOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeProductEditor() {
    setIsProductEditorOpen(false);
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductFieldErrors({});
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (isImageProcessing) {
      setFeedback({
        type: "error",
        text: "Please wait a moment while your photo finishes optimizing.",
      });
      return;
    }

    const clientErrors = validateProductForm(productForm);
    if (Object.keys(clientErrors).length > 0) {
      setProductFieldErrors(clientErrors);
      setFeedback({
        type: "error",
        text: "Please fix the highlighted fields below:",
        details: Object.values(clientErrors),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setProductFieldErrors({});
    setIsSaving(true);

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
      const wasEdit = Boolean(editingProductId);
      const savedProduct = editingProductId
        ? await updateProductFromClient(editingProductId, {
            ...basePayload,
            image: trimmedImage ? trimmedImage : null,
          })
        : await createProductFromClient({
            ...basePayload,
            image: trimmedImage ? trimmedImage : undefined,
          });

      setProducts((prev) =>
        wasEdit
          ? prev.map((item) =>
              item.id === savedProduct.id ? savedProduct : item
            )
          : [savedProduct, ...prev]
      );

      closeProductEditor();
      setFeedback({
        type: "success",
        text: wasEdit
          ? "Product changes saved."
          : "New product added to catalog.",
      });
    } catch (error) {
      const parsed = extractErrorFeedback(
        error,
        "Could not save product. Check required fields."
      );
      setProductFieldErrors(parsed.fieldErrors);
      setFeedback({
        type: "error",
        text: parsed.summary,
        details: parsed.details,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchiveProduct(product: Product) {
    setFeedback(null);
    const updated = await deleteProductFromClient(product.id);
    setProducts((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setFeedback({
      type: "success",
      text: `${product.name} moved to Archived.`,
    });
  }

  async function handleUnarchiveProduct(product: Product) {
    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = await updateProductFromClient(product.id, {
        isActive: true,
      });
      setProducts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setFeedback({
        type: "success",
        text: `${product.name} restored to your active storefront.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not unarchive product.",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePermanentDeleteProduct(product: Product) {
    setFeedback(null);
    await permanentlyDeleteProductFromClient(product.id);
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
    if (editingProductId === product.id) {
      closeProductEditor();
    }
    setFeedback({
      type: "success",
      text: `${product.name} was permanently deleted.`,
    });
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pressOriginRef.current = null;
    setPressingProductId(null);
  }

  function startLongPress(
    event: React.PointerEvent<HTMLDivElement>,
    product: Product
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea")) {
      return;
    }

    clearLongPressTimer();
    pressOriginRef.current = { x: event.clientX, y: event.clientY };
    setPressingProductId(product.id);

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      pressOriginRef.current = null;
      setPressingProductId(null);
      setActionProduct(product);
    }, 480);
  }

  function checkLongPressMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pressOriginRef.current) return;
    const dx = Math.abs(event.clientX - pressOriginRef.current.x);
    const dy = Math.abs(event.clientY - pressOriginRef.current.y);
    if (dx > 10 || dy > 10) {
      clearLongPressTimer();
    }
  }

  function openNewCategoryEditor() {
    setFeedback(null);
    setCategoryFieldErrors({});
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setIsCategoryEditorOpen(true);
  }

  function openEditCategoryEditor(category: Category) {
    setFeedback(null);
    setCategoryFieldErrors({});
    setEditingCategoryId(category.id);
    setCategoryForm(toCategoryForm(category));
    setIsCategoryEditorOpen(true);
  }

  function closeCategoryEditor() {
    setIsCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryFieldErrors({});
  }

  async function handleSaveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (isImageProcessing) {
      setFeedback({
        type: "error",
        text: "Please wait a moment while your photo finishes optimizing.",
      });
      return;
    }

    const clientErrors = validateCategoryForm(categoryForm);
    if (Object.keys(clientErrors).length > 0) {
      setCategoryFieldErrors(clientErrors);
      setFeedback({
        type: "error",
        text: "Please fix the highlighted fields below:",
        details: Object.values(clientErrors),
      });
      return;
    }

    setCategoryFieldErrors({});
    setIsSaving(true);

    const trimmedImage = categoryForm.image.trim();

    try {
      const wasEdit = Boolean(editingCategoryId);
      const savedCategory = editingCategoryId
        ? await updateCategoryFromClient(editingCategoryId, {
            name: categoryForm.name.trim(),
            description: normalizeOptional(categoryForm.description),
            image: trimmedImage ? trimmedImage : null,
          })
        : await createCategoryFromClient({
            name: categoryForm.name.trim(),
            description: normalizeOptional(categoryForm.description),
            image: trimmedImage ? trimmedImage : undefined,
          });

      setCategories((prev) => {
        const next = wasEdit
          ? prev.map((item) =>
              item.id === savedCategory.id ? savedCategory : item
            )
          : [...prev, savedCategory];
        return [...next].sort((a, b) => a.name.localeCompare(b.name));
      });

      closeCategoryEditor();
      setFeedback({
        type: "success",
        text: wasEdit ? "Category updated." : "Category created.",
      });
    } catch (error) {
      const parsed = extractErrorFeedback(error, "Could not save category.");
      setCategoryFieldErrors(parsed.fieldErrors);
      setFeedback({
        type: "error",
        text: parsed.summary,
        details: parsed.details,
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
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
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

        {section === "products" && !isProductEditorOpen && !isBulkUploadOpen ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={openBulkUploadPanel}
              disabled={categories.length === 0}
              className="min-h-11 w-full sm:w-auto"
            >
              <Images className="mr-1.5 h-4 w-4" />
              Bulk upload drafts
            </Button>
            <Button
              type="button"
              onClick={openNewProductEditor}
              disabled={categories.length === 0}
              className="min-h-11 w-full sm:w-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add product
            </Button>
          </div>
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
          role={feedback.type === "error" ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">{feedback.text}</p>
          {feedback.details && feedback.details.length > 0 ? (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs">
              {feedback.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {section === "products" ? (
        <div className="space-y-5">
          {isBulkUploadOpen ? (
            <AdminBulkDraftUploader
              categories={categories}
              existingProducts={products}
              onProductCreated={(created) => {
                setProducts((prev) => [created, ...prev]);
              }}
              onComplete={({ savedCount, failedCount }) => {
                setProductFilter("inactive");
                if (failedCount === 0) {
                  setIsBulkUploadOpen(false);
                  setFeedback({
                    type: "success",
                    text: `Saved ${savedCount} draft ${savedCount === 1 ? "product" : "products"} under Archived. Click Edit on any item to enter its real name, price, description, and check "Visible in storefront".`,
                  });
                } else {
                  setFeedback({
                    type: "error",
                    text: `Saved ${savedCount} draft products, while ${failedCount} failed. Check the items marked in red below to retry.`,
                  });
                }
              }}
              onCancel={() => setIsBulkUploadOpen(false)}
            />
          ) : null}

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

              <form noValidate onSubmit={handleSaveProduct} className="space-y-6">
                <AdminImageDropzone
                  id="product-image-upload"
                  label="Product photo"
                  value={productForm.image}
                  error={productFieldErrors.image}
                  onProcessingChange={setIsImageProcessing}
                  onChange={(nextImage) => {
                    clearProductFieldError("image");
                    setProductForm((prev) => ({ ...prev, image: nextImage }));
                  }}
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
                      aria-invalid={Boolean(productFieldErrors.name)}
                      className={`h-11 ${
                        productFieldErrors.name
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      placeholder="e.g. Raw Mau Forest Honey (500g)"
                      value={productForm.name}
                      onChange={(e) => {
                        clearProductFieldError("name");
                        setProductForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.name ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        At least 3 characters.
                      </p>
                    )}
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
                      aria-invalid={Boolean(productFieldErrors.categoryId)}
                      className={`h-11 w-full rounded-md border bg-background px-3 text-sm ${
                        productFieldErrors.categoryId
                          ? "border-destructive"
                          : "border-input"
                      }`}
                      value={productForm.categoryId}
                      onChange={(e) => {
                        clearProductFieldError("categoryId");
                        setProductForm((prev) => ({
                          ...prev,
                          categoryId: e.target.value,
                        }));
                      }}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {productFieldErrors.categoryId ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.categoryId}
                      </p>
                    ) : null}
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
                      aria-invalid={Boolean(productFieldErrors.price)}
                      className={`h-11 tabular-nums ${
                        productFieldErrors.price
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="e.g. 1500"
                      value={productForm.price}
                      onChange={(e) => {
                        clearProductFieldError("price");
                        setProductForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.price ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.price}
                      </p>
                    ) : null}
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
                      aria-invalid={Boolean(productFieldErrors.stockQuantity)}
                      className={`h-11 tabular-nums ${
                        productFieldErrors.stockQuantity
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 25"
                      value={productForm.stockQuantity}
                      onChange={(e) => {
                        clearProductFieldError("stockQuantity");
                        setProductForm((prev) => ({
                          ...prev,
                          stockQuantity: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.stockQuantity ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.stockQuantity}
                      </p>
                    ) : null}
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
                    aria-invalid={Boolean(productFieldErrors.description)}
                    rows={3}
                    className={
                      productFieldErrors.description
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                    placeholder="Describe the product clearly for shoppers (at least 5 characters)..."
                    value={productForm.description}
                    onChange={(e) => {
                      clearProductFieldError("description");
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                    }}
                  />
                  {productFieldErrors.description ? (
                    <p className="text-xs font-medium text-destructive">
                      {productFieldErrors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      At least 5 characters.
                    </p>
                  )}
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
                      aria-invalid={Boolean(productFieldErrors.benefits)}
                      rows={2}
                      className={
                        productFieldErrors.benefits
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      placeholder="Key wellness benefits..."
                      value={productForm.benefits}
                      onChange={(e) => {
                        clearProductFieldError("benefits");
                        setProductForm((prev) => ({
                          ...prev,
                          benefits: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.benefits ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.benefits}
                      </p>
                    ) : null}
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
                      aria-invalid={Boolean(
                        productFieldErrors.usageInstructions
                      )}
                      rows={2}
                      className={
                        productFieldErrors.usageInstructions
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      placeholder="Recommended daily usage..."
                      value={productForm.usageInstructions}
                      onChange={(e) => {
                        clearProductFieldError("usageInstructions");
                        setProductForm((prev) => ({
                          ...prev,
                          usageInstructions: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.usageInstructions ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.usageInstructions}
                      </p>
                    ) : null}
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
                      aria-invalid={Boolean(productFieldErrors.ingredients)}
                      rows={2}
                      className={
                        productFieldErrors.ingredients
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                      placeholder="100% pure organic..."
                      value={productForm.ingredients}
                      onChange={(e) => {
                        clearProductFieldError("ingredients");
                        setProductForm((prev) => ({
                          ...prev,
                          ingredients: e.target.value,
                        }));
                      }}
                    />
                    {productFieldErrors.ingredients ? (
                      <p className="text-xs font-medium text-destructive">
                        {productFieldErrors.ingredients}
                      </p>
                    ) : null}
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
                    disabled={
                      isSaving || isImageProcessing || categories.length === 0
                    }
                    className="min-h-11 sm:min-w-[160px]"
                  >
                    {isImageProcessing
                      ? "Optimizing photo..."
                      : isSaving
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
          <div className="space-y-3 rounded-xl border border-border/80 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    className={`min-h-9 rounded-md px-3 text-xs font-medium tabular-nums transition-colors whitespace-nowrap ${
                      productFilter === tab.key
                        ? "bg-foreground text-background"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label} ({filterCounts[tab.key]})
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Press and hold any product row (or right-click) to archive,
              unarchive, or delete permanently.
            </p>
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
                const isPressing = pressingProductId === product.id;

                return (
                  <div
                    key={product.id}
                    onPointerDown={(e) => startLongPress(e, product)}
                    onPointerMove={checkLongPressMove}
                    onPointerUp={clearLongPressTimer}
                    onPointerCancel={clearLongPressTimer}
                    onPointerLeave={clearLongPressTimer}
                    onContextMenu={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (target?.closest("button, a, input, select, textarea")) {
                        return;
                      }
                      e.preventDefault();
                      clearLongPressTimer();
                      setActionProduct(product);
                    }}
                    className={`flex select-none touch-pan-y flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isPressing ? "bg-muted/50" : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            draggable={false}
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
                      {!product.isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSaving}
                          className="min-h-10 flex-1 sm:flex-initial"
                          onClick={() => {
                            void handleUnarchiveProduct(product).catch(
                              () => undefined
                            );
                          }}
                        >
                          <ArchiveRestore className="mr-1.5 h-3.5 w-3.5 text-primary" />
                          Unarchive
                        </Button>
                      ) : null}

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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminProductActionDialog
            product={actionProduct}
            categoryName={
              actionProduct
                ? categoryById.get(actionProduct.categoryId)?.name
                : undefined
            }
            onClose={() => setActionProduct(null)}
            onArchive={handleArchiveProduct}
            onUnarchive={handleUnarchiveProduct}
            onPermanentDelete={handlePermanentDeleteProduct}
          />
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

              <form noValidate onSubmit={handleSaveCategory} className="space-y-5">
                <AdminImageDropzone
                  id="category-image-upload"
                  label="Category photo (optional)"
                  value={categoryForm.image}
                  error={categoryFieldErrors.image}
                  onProcessingChange={setIsImageProcessing}
                  onChange={(nextImage) => {
                    clearCategoryFieldError("image");
                    setCategoryForm((prev) => ({ ...prev, image: nextImage }));
                  }}
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
                    aria-invalid={Boolean(categoryFieldErrors.name)}
                    className={`h-11 ${
                      categoryFieldErrors.name
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    placeholder="e.g. Herbal Teas"
                    value={categoryForm.name}
                    onChange={(e) => {
                      clearCategoryFieldError("name");
                      setCategoryForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                    }}
                  />
                  {categoryFieldErrors.name ? (
                    <p className="text-xs font-medium text-destructive">
                      {categoryFieldErrors.name}
                    </p>
                  ) : null}
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
                    aria-invalid={Boolean(categoryFieldErrors.description)}
                    rows={2}
                    className={
                      categoryFieldErrors.description
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                    placeholder="Short category summary for shoppers..."
                    value={categoryForm.description}
                    onChange={(e) => {
                      clearCategoryFieldError("description");
                      setCategoryForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }));
                    }}
                  />
                  {categoryFieldErrors.description ? (
                    <p className="text-xs font-medium text-destructive">
                      {categoryFieldErrors.description}
                    </p>
                  ) : null}
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
                    disabled={isSaving || isImageProcessing}
                    className="min-h-11 sm:min-w-[150px]"
                  >
                    {isImageProcessing
                      ? "Optimizing photo..."
                      : isSaving
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