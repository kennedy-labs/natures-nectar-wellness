"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

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

type AdminCancelOrderDialogProps = {
  order: AdminOrder | null;
  onClose: () => void;
  onConfirmCancel: (order: AdminOrder) => Promise<void>;
};

export function AdminCancelOrderDialog({
  order,
  onClose,
  onConfirmCancel,
}: AdminCancelOrderDialogProps) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !cancelling) {
      setError(null);
      onClose();
    }
  }

  async function handleConfirm() {
    if (!order || cancelling) return;
    setCancelling(true);
    setError(null);
    try {
      await onConfirmCancel(order);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not cancel this order."
      );
    } finally {
      setCancelling(false);
    }
  }

  const statusMeta = order ? getAdminOrderStatusMeta(order) : null;

  return (
    <Dialog open={Boolean(order)} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-[#FCFBF8] sm:max-w-md">
        {order ? (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2 text-amber-800">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">Cancel order</span>
              </div>
              <DialogTitle className="font-display text-xl font-medium text-foreground">
                Cancel order {order.orderNumber}?
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                This marks the order as cancelled, voids any pending payment
                request, and restores its items back to catalog stock.
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
                disabled={cancelling}
                onClick={() => handleOpenChange(false)}
                className="min-h-10 bg-white"
              >
                Keep order
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={cancelling}
                onClick={handleConfirm}
                className="min-h-10 gap-1.5"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Cancel &amp; restore stock
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
