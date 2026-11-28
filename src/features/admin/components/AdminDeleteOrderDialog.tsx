"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AdminOrder,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
} from "@/features/admin/utils/order-display.utils";
import { formatKes } from "@/lib/format";

type AdminDeleteOrderDialogProps = {
  order: AdminOrder | null;
  onClose: () => void;
  onConfirmDelete: (order: AdminOrder) => Promise<void>;
};

export function AdminDeleteOrderDialog({
  order,
  onClose,
  onConfirmDelete,
}: AdminDeleteOrderDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !deleting) {
      setError(null);
      onClose();
    }
  }

  async function handleConfirm() {
    if (!order || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirmDelete(order);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete this order."
      );
    } finally {
      setDeleting(false);
    }
  }

  const restoresStock = order
    ? !["DELIVERED", "CANCELLED"].includes(order.status)
    : false;
  const statusMeta = order ? getAdminOrderStatusMeta(order) : null;

  return (
    <Dialog open={Boolean(order)} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-[#FCFBF8] sm:max-w-md">
        {order ? (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Permanent deletion</span>
              </div>
              <DialogTitle className="font-display text-xl font-medium text-foreground">
                Delete order {order.orderNumber}?
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {restoresStock
                  ? "This will permanently remove the order record and restore its reserved item stock back to your catalog. This cannot be undone."
                  : "This will permanently remove this order record from your database. This cannot be undone."}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-white p-3.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">
                  {order.customerName}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatKes(getAdminOrderTotal(order))}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {statusMeta?.label} · {order.items?.length ?? 0}{" "}
                {(order.items?.length ?? 0) === 1 ? "line item" : "line items"}
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
              >
                {error}
              </div>
            ) : null}

            <DialogFooter className="gap-2 pt-1 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => handleOpenChange(false)}
                className="min-h-10 bg-white"
              >
                Keep order
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={handleConfirm}
                className="min-h-10 gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete permanently
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
