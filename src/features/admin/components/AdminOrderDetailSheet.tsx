"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type AdminOrder,
  type AdminOrderPayment,
  formatAdminOrderDate,
  getAdminDeliveryLabel,
  getAdminOrderStatusMeta,
  getAdminOrderTotal,
  getAdminPaymentMethodLabel,
  getAdminPaymentStatusLabel,
  getToneClasses,
  toWhatsAppPhone,
} from "@/features/admin/utils/order-display.utils";
import {
  getDeliveryFeeSummary,
  parseDeliveryNotesPin,
} from "@/features/orders/utils/order.utils";
import {
  getNextOrderAction,
  hasVerifiedPayment,
  isCashPaymentMethod,
  normalizeOrderStage,
} from "@/features/orders/utils/order-workflow.utils";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

type FocusSection = "quote" | "payment" | null;

type AdminOrderDetailSheetProps = {
  order: AdminOrder | null;
  focusSection?: FocusSection;
  onClose: () => void;
  onConfirmDeliveryQuote: (
    orderId: string,
    fee: number,
    notes: string
  ) => Promise<void>;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  onVerifyPayment: (
    payment: AdminOrderPayment,
    order: AdminOrder,
    transactionRef: string,
    amount: number
  ) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  onDeleteOrder: (order: AdminOrder) => Promise<void>;
};

function StatusIcon({ stage }: { stage: string }) {
  if (stage === "CANCELLED") {
    return <XCircle className="h-4 w-4 shrink-0" />;
  }
  if (stage === "DELIVERED") {
    return <CheckCircle2 className="h-4 w-4 shrink-0" />;
  }
  if (stage === "OUT_FOR_DELIVERY") {
    return <Truck className="h-4 w-4 shrink-0" />;
  }
  if (stage === "PROCESSING") {
    return <Package className="h-4 w-4 shrink-0" />;
  }
  return <Clock className="h-4 w-4 shrink-0" />;
}

function OrderDetailContent({
  order,
  focusSection = null,
  onClose,
  onConfirmDeliveryQuote,
  onUpdateStatus,
  onVerifyPayment,
  onCancelOrder,
  onDeleteOrder,
}: {
  order: AdminOrder;
  focusSection?: FocusSection;
  onClose: () => void;
  onConfirmDeliveryQuote: AdminOrderDetailSheetProps["onConfirmDeliveryQuote"];
  onUpdateStatus: AdminOrderDetailSheetProps["onUpdateStatus"];
  onVerifyPayment: AdminOrderDetailSheetProps["onVerifyPayment"];
  onCancelOrder: AdminOrderDetailSheetProps["onCancelOrder"];
  onDeleteOrder: AdminOrderDetailSheetProps["onDeleteOrder"];
}) {
  const stage = normalizeOrderStage(order);
  const nextAction = getNextOrderAction(order);
  const total = getAdminOrderTotal(order);
  const payment = order.payments?.[0];
  const paymentStatus = payment?.status;
  const isPaid = hasVerifiedPayment(order);
  const isCashOrder = isCashPaymentMethod(order.preferredPaymentMethod);
  const isClosed = stage === "DELIVERED" || stage === "CANCELLED";

  const [feeInput, setFeeInput] = useState(
    order.deliveryFee !== null && order.deliveryFee !== undefined
      ? String(order.deliveryFee)
      : ""
  );
  const [quoteNotesInput, setQuoteNotesInput] = useState(
    order.deliveryQuoteNotes ?? ""
  );
  const [showQuoteEditor, setShowQuoteEditor] = useState(
    stage === "REVIEWING_DELIVERY" || focusSection === "quote"
  );
  const [transactionRefInput, setTransactionRefInput] = useState(
    payment?.transactionRef ?? ""
  );
  const [amountInput, setAmountInput] = useState(String(total));

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<"cancel" | "delete" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const statusMeta = getAdminOrderStatusMeta(order);
  const tone = getToneClasses(statusMeta.tone);
  const progressSteps =
    order.deliveryMethod === "PICKUP"
      ? (["Placed", "Preparing", "Ready for Pickup", "Collected"] as const)
      : (["Placed", "Preparing", "Out for Delivery", "Delivered"] as const);
  const { cleanNotes: cleanDeliveryNotes, mapUrl } = parseDeliveryNotesPin(
    order.deliveryNotes
  );
  const waMessage = `Hello ${order.customerName}, regarding your Nature's Nectar order ${order.orderNumber} (Total: ${formatKes(total)}).`;
  const waHref = `https://wa.me/${toWhatsAppPhone(order.customerPhone)}?text=${encodeURIComponent(waMessage)}`;

  async function runAction(actionKey: string, task: () => Promise<void>) {
    if (busyAction) return;
    setBusyAction(actionKey);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusyAction(null);
    }
  }

  function handleSaveQuote() {
    const fee = Number(feeInput);
    if (feeInput.trim() === "" || !Number.isFinite(fee) || fee < 0) {
      setError("Enter a valid delivery fee (0 or higher).");
      return;
    }
    void runAction("quote", async () => {
      await onConfirmDeliveryQuote(order.id, fee, quoteNotesInput.trim());
      setShowQuoteEditor(false);
    });
  }

  function handleVerifyPayment() {
    if (!payment) return;
    const amount = Number(amountInput || total);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid positive payment amount.");
      return;
    }
    void runAction("verify", async () => {
      await onVerifyPayment(
        payment,
        order,
        transactionRefInput.trim(),
        amount
      );
    });
  }

  return (
    <>
      {/* Top Header */}
      <SheetHeader className="border-b border-border bg-[#F7F5F0] px-6 py-5 pr-12 text-left">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">
            {order.orderNumber}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {formatAdminOrderDate(order.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3 pt-1">
          <SheetTitle className="font-display text-2xl font-medium tracking-tight text-foreground">
            {order.customerName}
          </SheetTitle>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
              tone.badgeClass
            )}
          >
            <StatusIcon stage={stage} />
            <span>{statusMeta.label}</span>
          </span>
        </div>

        <SheetDescription className="sr-only">
          Full details and management actions for order {order.orderNumber}
        </SheetDescription>

        {/* Clean 4-Step Progress Bar aligned 1-to-1 with Customer Tracking */}
        {stage !== "CANCELLED" ? (
          <div className="pt-3">
            <div className="grid grid-cols-4 gap-1.5">
              {progressSteps.map((stepLabel, idx) => {
                const reached = idx <= statusMeta.stepIndex;
                return (
                  <div key={stepLabel} className="space-y-1">
                    <div
                      className={cn(
                        "h-1 w-full rounded-full transition-colors",
                        reached ? "bg-[#1F4E37]" : "bg-border"
                      )}
                    />
                    <p
                      className={cn(
                        "truncate text-[11px] font-medium",
                        reached ? "text-foreground" : "text-muted-foreground/80"
                      )}
                    >
                      {stepLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </SheetHeader>

      {/* Scrollable Body */}
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {/* Plain-English Next-Step Guidance */}
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-xs leading-relaxed",
            tone.subtleBg
          )}
        >
          <p className={cn("font-semibold", tone.text)}>
            {statusMeta.label} — {statusMeta.nextActionHint}
          </p>
          <p className="mt-0.5 text-muted-foreground">{statusMeta.guidance}</p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
          >
            {error}
          </div>
        ) : null}

        {/* State-Driven Single Primary Action */}
        {!isClosed || isPaid ? (
          <section aria-label="Order actions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Next action
              </h3>
              {!isClosed && stage !== "REVIEWING_DELIVERY" && !showQuoteEditor ? (
                <button
                  type="button"
                  onClick={() => setShowQuoteEditor(true)}
                  className="text-xs font-medium text-[#1F4E37] underline-offset-4 hover:underline"
                >
                  {order.deliveryFee != null
                    ? "Edit delivery fee"
                    : "Set delivery fee"}
                </button>
              ) : null}
            </div>

            {/* Delivery Quote Editor */}
            {!isClosed && showQuoteEditor ? (
              <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {stage === "REVIEWING_DELIVERY"
                        ? "Set delivery quote"
                        : "Adjust delivery fee"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stage === "REVIEWING_DELIVERY"
                        ? isCashOrder
                          ? "Saving moves this order to Preparing."
                          : "Saving updates the order total so payment can be verified."
                        : "Updating delivery fee recalculates the order total while preserving progress."}
                    </p>
                  </div>
                  {stage !== "REVIEWING_DELIVERY" ? (
                    <button
                      type="button"
                      onClick={() => setShowQuoteEditor(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Hide
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-2.5 sm:grid-cols-[140px_1fr]">
                  <div>
                    <label
                      htmlFor={`quote-fee-${order.id}`}
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Fee (KES)
                    </label>
                    <Input
                      id={`quote-fee-${order.id}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 350"
                      autoFocus={focusSection === "quote"}
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="h-10 bg-[#FCFBF8] tabular-nums"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`quote-notes-${order.id}`}
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Courier note (optional)
                    </label>
                    <Input
                      id={`quote-notes-${order.id}`}
                      type="text"
                      placeholder="e.g. G4S / Wells Fargo to Kisumu"
                      value={quoteNotesInput}
                      onChange={(e) => setQuoteNotesInput(e.target.value)}
                      className="h-10 bg-[#FCFBF8]"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={handleSaveQuote}
                  className="min-h-10 w-full bg-[#B45309] text-white hover:bg-[#92400E] sm:w-auto"
                >
                  {busyAction === "quote" ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Saving quote...
                    </>
                  ) : (
                    "Save delivery quote"
                  )}
                </Button>
              </div>
            ) : null}

            {/* Verify Payment Form (Only when AWAITING_PAYMENT) */}
            {stage === "AWAITING_PAYMENT" && payment ? (
              <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Verify {getAdminPaymentMethodLabel(payment.method)} payment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enter the M-Pesa or bank confirmation code to verify payment
                    and move this order into Preparing.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-[1fr_130px]">
                  <div>
                    <label
                      htmlFor={`pay-ref-${order.id}`}
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Transaction code
                    </label>
                    <Input
                      id={`pay-ref-${order.id}`}
                      type="text"
                      placeholder="e.g. SJK8912P4"
                      autoFocus={focusSection === "payment"}
                      value={transactionRefInput}
                      onChange={(e) => setTransactionRefInput(e.target.value)}
                      className="h-10 bg-[#FCFBF8] font-mono text-xs uppercase"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`pay-amt-${order.id}`}
                      className="mb-1 block text-xs text-muted-foreground"
                    >
                      Amount (KES)
                    </label>
                    <Input
                      id={`pay-amt-${order.id}`}
                      type="number"
                      min="1"
                      step="0.01"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="h-10 bg-[#FCFBF8] tabular-nums"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={handleVerifyPayment}
                  className="min-h-10 w-full gap-1.5 bg-[#B45309] text-white hover:bg-[#92400E] sm:w-auto"
                >
                  {busyAction === "verify" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Verify payment &amp; prepare order
                    </>
                  )}
                </Button>
              </div>
            ) : null}

            {/* Paid Confirmation Strip */}
            {isPaid && payment ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1F4E37]/20 bg-[#1F4E37]/[0.06] px-4 py-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#1F4E37]">
                  <CheckCircle2 className="h-4 w-4" />
                  {getAdminPaymentMethodLabel(payment.method)} payment verified
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {payment.transactionRef ? `${payment.transactionRef} · ` : ""}
                  {formatKes(payment.amount ?? total)}
                </span>
              </div>
            ) : null}

            {/* Single Valid Next-Step Fulfillment Card */}
            {!isClosed && nextAction?.kind === "transition" ? (
              <div className="space-y-3 rounded-xl border border-border bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {stage === "PROCESSING"
                      ? order.deliveryMethod === "PICKUP"
                        ? "Ready at pickup counter?"
                        : "Handed over for delivery?"
                      : order.deliveryMethod === "PICKUP"
                        ? "Confirm customer pickup"
                        : "Confirm delivery completion"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stage === "PROCESSING"
                      ? order.deliveryMethod === "PICKUP"
                        ? "Once packed, mark Ready for Pickup to alert your customer."
                        : "Once handed to the rider or courier, mark Out for Delivery."
                      : nextAction.autoVerifiesCash
                        ? `Confirm handover to mark Delivered and verify the ${formatKes(total)} cash payment.`
                        : "Mark Delivered once the customer has received their items."}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    runAction(`status-${nextAction.targetStatus}`, () =>
                      onUpdateStatus(order.id, nextAction.targetStatus)
                    )
                  }
                  className="min-h-10 w-full gap-1.5 bg-[#1F4E37] text-[#FCFBF8] hover:bg-[#173B2A] sm:w-auto"
                >
                  {busyAction === `status-${nextAction.targetStatus}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : nextAction.targetStatus === "OUT_FOR_DELIVERY" ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {nextAction.label}
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Customer & Delivery Details */}
        <section aria-label="Customer and delivery details" className="space-y-2.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Customer &amp; delivery
          </h3>
          <div className="grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="space-y-3 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {order.customerName}
                </p>
                {order.customerEmail ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {order.customerEmail}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-[#FCFBF8] px-2.5 text-xs font-medium tabular-nums text-foreground transition-colors hover:bg-muted"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.customerPhone}
                </a>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#1F4E37]/25 bg-[#1F4E37]/10 px-2.5 text-xs font-medium text-[#1F4E37] transition-colors hover:bg-[#1F4E37]/15"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="space-y-1.5 p-4 text-xs text-muted-foreground">
              <p className="text-sm font-medium text-foreground">
                {getAdminDeliveryLabel(order.deliveryMethod)}
              </p>
              {order.deliveryLocation ? (
                <p className="leading-relaxed text-foreground/85">
                  {order.deliveryLocation}
                </p>
              ) : null}
              {mapUrl ? (
                <div className="pt-1">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#1F4E37]/25 bg-[#1F4E37]/5 px-2.5 text-xs font-medium text-[#1F4E37] hover:bg-[#1F4E37]/10"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Open Map Pin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : null}
              {cleanDeliveryNotes ? (
                <p className="pt-1">Delivery note: {cleanDeliveryNotes}</p>
              ) : null}
              {order.customerNotes ? (
                <p className="pt-0.5">Customer note: {order.customerNotes}</p>
              ) : null}
              {order.deliveryQuoteNotes ? (
                <p className="pt-0.5">Quote note: {order.deliveryQuoteNotes}</p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Line Items & Payment Ledger */}
        <section aria-label="Order items" className="space-y-2.5">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Items &amp; summary
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {order.items && order.items.length > 0 ? (
              <ul className="divide-y divide-border/70 px-4">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm tabular-nums"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.quantity}×
                        </span>{" "}
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatKes(item.priceAtPurchase)} each
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-foreground">
                      {formatKes(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-xs text-muted-foreground">
                No line items recorded.
              </p>
            )}

            <div className="space-y-1.5 border-t border-border bg-[#F7F5F0]/70 px-4 py-3.5 text-xs">
              <div className="flex justify-between text-muted-foreground tabular-nums">
                <span>Subtotal</span>
                <span>{formatKes(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground tabular-nums">
                <span>Delivery</span>
                <span>
                  {getDeliveryFeeSummary(
                    order.deliveryMethod,
                    order.deliveryFee
                  )}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Payment</span>
                <span>
                  {getAdminPaymentMethodLabel(order.preferredPaymentMethod)} ·{" "}
                  {getAdminPaymentStatusLabel(paymentStatus)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-border/80 pt-2.5">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="font-display text-xl font-medium tabular-nums text-foreground">
                  {formatKes(total)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Cancel & Delete Controls */}
        <section
          aria-label="Order lifecycle controls"
          className="border-t border-border pt-5"
        >
          {confirmMode === "cancel" ? (
            <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/[0.05] p-4">
              <p className="text-sm font-medium text-foreground">
                Cancel order {order.orderNumber} and restore stock?
              </p>
              <p className="text-xs text-muted-foreground">
                This marks the order cancelled, voids any pending payment prompt,
                and adds its items back to catalog stock.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    runAction("cancel", async () => {
                      await onCancelOrder(order.id);
                      setConfirmMode(null);
                    })
                  }
                  className="min-h-10"
                >
                  {busyAction === "cancel" ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Confirm cancel & restore stock"
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => setConfirmMode(null)}
                  className="min-h-10 bg-white"
                >
                  Keep order
                </Button>
              </div>
            </div>
          ) : confirmMode === "delete" ? (
            <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/[0.05] p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">
                  Delete order {order.orderNumber} permanently?
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {!isClosed
                  ? "This permanently erases the order from your database and restores its reserved item stock back to your catalog."
                  : "This permanently removes this order record from your database. This cannot be undone."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={Boolean(busyAction)}
                  onClick={() =>
                    runAction("delete", async () => {
                      await onDeleteOrder(order);
                      onClose();
                    })
                  }
                  className="min-h-10 gap-1.5"
                >
                  {busyAction === "delete" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Yes, delete permanently
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => setConfirmMode(null)}
                  className="min-h-10 bg-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {!isClosed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => setConfirmMode("cancel")}
                  className="min-h-10 gap-1.5 bg-white text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel &amp; restore stock
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  This order is closed.
                </span>
              )}

              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={Boolean(busyAction)}
                onClick={() => setConfirmMode("delete")}
                className="min-h-10 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete order
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function AdminOrderDetailSheet({
  order,
  focusSection = null,
  onClose,
  onConfirmDeliveryQuote,
  onUpdateStatus,
  onVerifyPayment,
  onCancelOrder,
  onDeleteOrder,
}: AdminOrderDetailSheetProps) {
  return (
    <Sheet open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-[#FCFBF8] p-0 sm:max-w-xl"
      >
        {order ? (
          <OrderDetailContent
            key={`${order.id}-${focusSection ?? "default"}`}
            order={order}
            focusSection={focusSection}
            onClose={onClose}
            onConfirmDeliveryQuote={onConfirmDeliveryQuote}
            onUpdateStatus={onUpdateStatus}
            onVerifyPayment={onVerifyPayment}
            onCancelOrder={onCancelOrder}
            onDeleteOrder={onDeleteOrder}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
