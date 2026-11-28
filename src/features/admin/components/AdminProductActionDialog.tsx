"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ImageOff,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "@/features/products/types/product.types";
import { formatKes } from "@/lib/format";

type AdminProductActionDialogProps = {
  product: Product | null;
  categoryName?: string;
  onClose: () => void;
  onArchive: (product: Product) => Promise<void>;
  onUnarchive: (product: Product) => Promise<void>;
  onPermanentDelete: (product: Product) => Promise<void>;
};

export function AdminProductActionDialog({
  product,
  categoryName,
  onClose,
  onArchive,
  onUnarchive,
  onPermanentDelete,
}: AdminProductActionDialogProps) {
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  const [busyAction, setBusyAction] = useState<
    "archive" | "unarchive" | "delete" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !busyAction) {
      setConfirmPermanent(false);
      setError(null);
      onClose();
    }
  }

  async function handleArchiveClick() {
    if (!product || busyAction) return;
    setBusyAction("archive");
    setError(null);
    try {
      await onArchive(product);
      setConfirmPermanent(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not archive product."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleUnarchiveClick() {
    if (!product || busyAction) return;
    setBusyAction("unarchive");
    setError(null);
    try {
      await onUnarchive(product);
      setConfirmPermanent(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not unarchive product."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handlePermanentDeleteClick() {
    if (!product || busyAction) return;
    setBusyAction("delete");
    setError(null);
    try {
      await onPermanentDelete(product);
      setConfirmPermanent(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not permanently delete product."
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/80 bg-white sm:max-w-md">
        {product ? (
          confirmPermanent ? (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-medium">
                    Permanent deletion
                  </span>
                </div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Delete &ldquo;{product.name}&rdquo; permanently?
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  This completely erases the product and its saved photo from
                  your catalog while keeping completed or cancelled order
                  records intact. Products with active orders cannot be deleted.
                </DialogDescription>
              </DialogHeader>

              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <DialogFooter className="gap-2 pt-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => {
                    setError(null);
                    setConfirmPermanent(false);
                  }}
                  className="min-h-11"
                >
                  Back
                </Button>

                {error && product.isActive ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={Boolean(busyAction)}
                    onClick={handleArchiveClick}
                    className="min-h-11 gap-1.5"
                  >
                    {busyAction === "archive" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    Archive instead
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="destructive"
                  disabled={Boolean(busyAction)}
                  onClick={handlePermanentDeleteClick}
                  className="min-h-11 gap-1.5"
                >
                  {busyAction === "delete" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Yes, delete permanently
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Product options
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Choose what you want to do with this item.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground/60" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {product.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {categoryName ?? "Uncategorized"} · {formatKes(product.price)}{" "}
                    · {product.isActive ? "Active" : "Archived"}
                  </p>
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <div className="grid gap-2.5 pt-1">
                {product.isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(busyAction)}
                    onClick={handleArchiveClick}
                    className="min-h-11 w-full justify-start gap-2.5"
                  >
                    {busyAction === "archive" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>
                      {busyAction === "archive"
                        ? "Archiving..."
                        : "Archive product"}
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={Boolean(busyAction)}
                    onClick={handleUnarchiveClick}
                    className="min-h-11 w-full justify-start gap-2.5"
                  >
                    {busyAction === "unarchive" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-4 w-4 text-primary" />
                    )}
                    <span>
                      {busyAction === "unarchive"
                        ? "Unarchiving..."
                        : "Unarchive (restore to store)"}
                    </span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => {
                    setError(null);
                    setConfirmPermanent(true);
                  }}
                  className="min-h-11 w-full justify-start gap-2.5 border-destructive/30 text-destructive hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete permanently</span>
                </Button>
              </div>

              <DialogFooter className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={Boolean(busyAction)}
                  onClick={() => handleOpenChange(false)}
                  className="min-h-10 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
