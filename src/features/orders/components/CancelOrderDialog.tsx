"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { readApiData } from "@/lib/api-client";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { CustomerOrderRecord } from "./FeaturedOrderStage";

const CANCEL_REASONS = [
  "Ordered wrong item",
  "Changed my mind",
  "Delivery timing",
  "Found another option",
  "Other",
] as const;

type CancelOrderDialogProps = {
  order: CustomerOrderRecord | null;
  checkoutPhone: string | null;
  onClose: () => void;
  onCancelled: (updatedOrder: CustomerOrderRecord) => void;
};

export function CancelOrderDialog({
  order,
  checkoutPhone,
  onClose,
  onCancelled,
}: CancelOrderDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPaid = order?.payment?.status === "VERIFIED";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !submitting) {
      setSelectedReason(null);
      setCustomNote("");
      setError(null);
      onClose();
    }
  }

  async function handleConfirmCancel() {
    if (!order || !checkoutPhone) {
      setError(
        "Missing checkout phone verification. Re-add this order with 'Find another order' first."
      );
      return;
    }

    const trimmedNote = customNote.trim();
    const combinedReason =
      selectedReason && selectedReason !== "Other"
        ? trimmedNote
          ? `${selectedReason} — ${trimmedNote}`
          : selectedReason
        : trimmedNote || (selectedReason === "Other" ? "Other" : "");

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/customer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          phone: checkoutPhone,
          ...(combinedReason ? { reason: combinedReason } : {}),
        }),
      });

      const updatedOrder = await readApiData<CustomerOrderRecord>(res);
      setSelectedReason(null);
      setCustomNote("");
      onCancelled(updatedOrder);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not cancel this order right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={Boolean(order)} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/80 bg-card sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">Cancel order</span>
          </div>
          <DialogTitle className="font-display text-xl font-medium text-foreground">
            Cancel {order?.orderNumber}?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {order
              ? `This immediately stops fulfillment for your ${formatKes(order.totalAmount)} order and returns reserved items to stock.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {isPaid ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3.5 text-xs leading-relaxed text-amber-950">
            <strong>Paid via M-Pesa:</strong> Cancelling stops preparation
            right away and keeps your verified receipt so you can message us on
            WhatsApp to arrange your M-Pesa refund.
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-xs font-medium text-foreground">
            Reason for cancelling{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={active}
                  disabled={submitting}
                  onClick={() =>
                    setSelectedReason((prev) =>
                      prev === reason ? null : reason
                    )
                  }
                  className={cn(
                    "min-h-9 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {reason}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cancel-order-note"
              className="text-xs text-muted-foreground"
            >
              Short note (optional)
            </label>
            <Textarea
              id="cancel-order-note"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value.slice(0, 180))}
              disabled={submitting}
              rows={2}
              placeholder="Anything you'd like our team to know..."
              className="resize-none bg-background text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-rose-50/90 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter className="gap-2 pt-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => handleOpenChange(false)}
            className="min-h-11"
          >
            Keep order
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={handleConfirmCancel}
            className="min-h-11 gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling order...
              </>
            ) : (
              "Confirm cancellation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
