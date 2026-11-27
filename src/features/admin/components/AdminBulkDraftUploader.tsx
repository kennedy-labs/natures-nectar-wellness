"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Images,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_TYPES,
  estimateDataUrlKb,
  optimizeAdminImageFile,
} from "@/features/admin/utils/image-optimize";
import type { Category } from "@/features/categories/types/category.types";
import { createProductFromClient } from "@/features/products/services/product-client.service";
import type { Product } from "@/features/products/types/product.types";
import { createProductSlug } from "@/features/products/utils/product.utils";

type QueuedDraftItem = {
  localId: string;
  fileName: string;
  draftName: string;
  dataUrl: string;
  sizeKb: number;
  status: "ready" | "saving" | "saved" | "error";
  errorMessage?: string;
};

type AdminBulkDraftUploaderProps = {
  categories: Category[];
  existingProducts: Product[];
  onProductCreated: (product: Product) => void;
  onComplete: (summary: { savedCount: number; failedCount: number }) => void;
  onCancel: () => void;
};

const DEFAULT_DESCRIPTION =
  "Product details, pricing, and description coming soon.";

function getStartingCounter(
  prefix: string,
  existingProducts: Product[],
  queuedItems: QueuedDraftItem[]
): number {
  const escaped = prefix.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}\\s+(\\d+)$`, "i");
  let maxNum = 0;

  for (const product of existingProducts) {
    const match = product.name.trim().match(pattern);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  for (const item of queuedItems) {
    const match = item.draftName.trim().match(pattern);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  return maxNum + 1;
}

function formatDraftName(prefix: string, num: number): string {
  const cleanPrefix = prefix.trim() || "Draft Product";
  return `${cleanPrefix} ${String(num).padStart(2, "0")}`;
}

export function AdminBulkDraftUploader({
  categories,
  existingProducts,
  onProductCreated,
  onComplete,
  onCancel,
}: AdminBulkDraftUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [namePrefix, setNamePrefix] = useState("Draft Product");
  const [items, setItems] = useState<QueuedDraftItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [optimizingProgress, setOptimizingProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  async function ingestFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setRejectedFiles([]);
    setOptimizingProgress({ done: 0, total: files.length });

    let nextNumber = getStartingCounter(namePrefix, existingProducts, items);
    const existingSlugs = new Set<string>([
      ...existingProducts.map((p) => p.slug),
      ...items.map((item) => createProductSlug(item.draftName)),
    ]);

    const added: QueuedDraftItem[] = [];
    const errors: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const dataUrl = await optimizeAdminImageFile(file);

        let candidateName = formatDraftName(namePrefix, nextNumber);
        while (existingSlugs.has(createProductSlug(candidateName))) {
          nextNumber += 1;
          candidateName = formatDraftName(namePrefix, nextNumber);
        }
        existingSlugs.add(createProductSlug(candidateName));
        nextNumber += 1;

        added.push({
          localId: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          draftName: candidateName,
          dataUrl,
          sizeKb: estimateDataUrlKb(dataUrl),
          status: "ready",
        });
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : `Could not process ${file.name}.`
        );
      }

      setOptimizingProgress({ done: index + 1, total: files.length });
    }

    if (added.length > 0) {
      setItems((prev) => [...prev, ...added]);
    }
    if (errors.length > 0) {
      setRejectedFiles(errors);
    }
    setOptimizingProgress(null);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void ingestFiles(event.target.files);
    }
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files) {
      void ingestFiles(event.dataTransfer.files);
    }
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((item) => item.localId !== localId));
  }

  function updateItemName(localId: string, nextName: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, draftName: nextName } : item
      )
    );
  }

  async function createSingleDraftWithSlugFallback(
    draftName: string,
    image: string,
    targetCategoryId: string
  ): Promise<Product> {
    const cleanName =
      draftName.trim().length >= 3 ? draftName.trim() : "Draft Product Item";

    try {
      return await createProductFromClient({
        name: cleanName,
        description: DEFAULT_DESCRIPTION,
        price: 1,
        stockQuantity: 0,
        image,
        categoryId: targetCategoryId,
        isFeatured: false,
        isActive: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const isSlugConflict =
        message.includes("unique") ||
        message.includes("already exists") ||
        message.includes("slug");

      if (!isSlugConflict) {
        throw error;
      }

      const uniqueSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      return createProductFromClient({
        name: `${cleanName} ${uniqueSuffix}`,
        description: DEFAULT_DESCRIPTION,
        price: 1,
        stockQuantity: 0,
        image,
        categoryId: targetCategoryId,
        isFeatured: false,
        isActive: false,
      });
    }
  }

  async function handleUploadAll() {
    if (!categoryId || isUploading || optimizingProgress) return;

    const pendingItems = items.filter(
      (item) => item.status === "ready" || item.status === "error"
    );
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ done: 0, total: pendingItems.length });

    let savedCount = 0;
    let failedCount = 0;
    let completedCount = 0;

    // Upload sequentially with concurrency 2 so Neon Postgres & serverless routes stay fast
    const queue = [...pendingItems];
    const concurrency = 2;

    async function worker() {
      while (queue.length > 0) {
        const nextItem = queue.shift();
        if (!nextItem) break;

        setItems((prev) =>
          prev.map((row) =>
            row.localId === nextItem.localId
              ? { ...row, status: "saving", errorMessage: undefined }
              : row
          )
        );

        try {
          const created = await createSingleDraftWithSlugFallback(
            nextItem.draftName,
            nextItem.dataUrl,
            categoryId
          );

          savedCount += 1;
          onProductCreated(created);

          setItems((prev) =>
            prev.map((row) =>
              row.localId === nextItem.localId
                ? { ...row, status: "saved", draftName: created.name }
                : row
            )
          );
        } catch (err) {
          failedCount += 1;
          const message =
            err instanceof Error ? err.message : "Failed to save draft.";

          setItems((prev) =>
            prev.map((row) =>
              row.localId === nextItem.localId
                ? { ...row, status: "error", errorMessage: message }
                : row
            )
          );
        }

        completedCount += 1;
        setUploadProgress({
          done: completedCount,
          total: pendingItems.length,
        });
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    setIsUploading(false);
    setUploadProgress(null);

    if (savedCount > 0) {
      onComplete({ savedCount, failedCount });
    }
  }

  const readyOrErrorCount = items.filter(
    (item) => item.status === "ready" || item.status === "error"
  ).length;
  const savedItemsCount = items.filter((item) => item.status === "saved").length;

  return (
    <div className="rounded-xl border border-border/80 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Bulk upload draft photos
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select up to 50+ photos at once. Photos are compressed locally and
            saved as <strong>Archived drafts</strong> (hidden from shoppers)
            until you add names, prices, and mark them active.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="min-h-10"
          disabled={isUploading}
          onClick={onCancel}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to products
        </Button>
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="bulk-draft-category"
              className="text-sm font-medium text-foreground"
            >
              Default category for these drafts *
            </label>
            <select
              id="bulk-draft-category"
              disabled={isUploading}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              You can change each product&apos;s category individually later.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="bulk-draft-prefix"
              className="text-sm font-medium text-foreground"
            >
              Placeholder name prefix
            </label>
            <Input
              id="bulk-draft-prefix"
              disabled={isUploading}
              value={namePrefix}
              onChange={(e) => setNamePrefix(e.target.value)}
              placeholder="Draft Product"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Files will be numbered automatically (e.g. Draft Product 01, 02...).
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleFileChange}
          className="sr-only"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!isUploading && !optimizingProgress) {
              inputRef.current?.click();
            }
          }}
          onKeyDown={(e) => {
            if (
              (e.key === "Enter" || e.key === " ") &&
              !isUploading &&
              !optimizingProgress
            ) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/15 hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            {optimizingProgress ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Images className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {optimizingProgress
                ? `Optimizing photos (${optimizingProgress.done} of ${optimizingProgress.total})...`
                : "Select or drag & drop all product photos at once"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP, GIF, AVIF, and SVG up to 10 MB per file.
            </p>
          </div>
        </div>

        {rejectedFiles.length > 0 ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <p className="font-medium">
              {rejectedFiles.length} file{rejectedFiles.length === 1 ? "" : "s"}{" "}
              could not be added:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {rejectedFiles.slice(0, 6).map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
              {rejectedFiles.length > 6 ? (
                <li>...and {rejectedFiles.length - 6} more.</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground tabular-nums">
                {items.length} photo{items.length === 1 ? "" : "s"} queued
                {savedItemsCount > 0 ? ` · ${savedItemsCount} saved` : ""}
              </p>

              <div className="flex items-center gap-2">
                {!isUploading && items.some((i) => i.status !== "saved") ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setItems((prev) =>
                        prev.filter((item) => item.status === "saved")
                      )
                    }
                    className="h-9 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear pending
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="max-h-[380px] divide-y divide-border/70 overflow-y-auto rounded-lg border border-border/80 bg-background">
              {items.map((item) => (
                <div
                  key={item.localId}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.dataUrl}
                      alt={item.draftName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <Input
                      type="text"
                      value={item.draftName}
                      disabled={
                        isUploading ||
                        item.status === "saving" ||
                        item.status === "saved"
                      }
                      onChange={(e) =>
                        updateItemName(item.localId, e.target.value)
                      }
                      aria-label={`Draft name for ${item.fileName}`}
                      className="h-9 text-sm"
                    />
                    <p className="truncate text-[11px] text-muted-foreground tabular-nums">
                      {item.fileName} · ~{item.sizeKb} KB
                      {item.errorMessage ? (
                        <span className="ml-2 text-destructive">
                          · {item.errorMessage}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.status === "saving" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : item.status === "saved" ? (
                      <CheckCircle2
                        aria-label="Saved"
                        className="h-4 w-4 text-primary"
                      />
                    ) : item.status === "error" ? (
                      <AlertCircle
                        aria-label="Failed"
                        className="h-4 w-4 text-destructive"
                      />
                    ) : null}

                    {item.status !== "saved" && !isUploading ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.fileName}`}
                        onClick={() => removeItem(item.localId)}
                        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {uploadProgress
              ? `Saving draft ${uploadProgress.done} of ${uploadProgress.total}...`
              : "Placeholder price is Ksh 1 and stock is 0 until you edit each item."}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={onCancel}
              className="min-h-11"
            >
              {savedItemsCount > 0 && readyOrErrorCount === 0
                ? "Done"
                : "Cancel"}
            </Button>

            <Button
              type="button"
              disabled={
                isUploading ||
                Boolean(optimizingProgress) ||
                readyOrErrorCount === 0 ||
                !categoryId
              }
              onClick={handleUploadAll}
              className="min-h-11 sm:min-w-[200px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving {uploadProgress?.done ?? 0} /{" "}
                  {uploadProgress?.total ?? readyOrErrorCount}...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Save {readyOrErrorCount} draft{" "}
                  {readyOrErrorCount === 1 ? "product" : "products"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
