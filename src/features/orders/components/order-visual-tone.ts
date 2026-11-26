import type { PaymentMethod } from "@/features/checkout/types/checkout.types";
import { formatWhatsappPaymentStatus } from "@/features/whatsapp/utils/whatsapp.utils";

export type OrderSemanticTone = "delivered" | "active" | "amber" | "alert";

export type OrderVisualProfile = {
  tone: OrderSemanticTone;
  statusLabel: string;
  statusDescription: string;
  paymentLabel: string;
  paymentPaid: boolean;
  paymentNeedsAttention: boolean;
  headerSurfaceClass: string;
  headerBorderClass: string;
  headerTitleClass: string;
  headerIconClass: string;
  paymentTextClass: string;
  rowBadgeIconClass: string;
  stepperAccentTone: "botanical" | "amber";
};

export type TrackingStepItem = {
  key: "PLACED" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  label: string;
};

export function getTrackingStepsForMethod(
  deliveryMethod: string
): readonly TrackingStepItem[] {
  if (deliveryMethod === "PICKUP") {
    return [
      { key: "PLACED", label: "Order Placed" },
      { key: "PROCESSING", label: "Preparing" },
      { key: "OUT_FOR_DELIVERY", label: "Ready for Pickup" },
      { key: "DELIVERED", label: "Collected" },
    ] as const;
  }

  return [
    { key: "PLACED", label: "Order Placed" },
    { key: "PROCESSING", label: "Preparing" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { key: "DELIVERED", label: "Delivered" },
  ] as const;
}

export function getProgressIndex(status: string): number {
  if (status === "DELIVERED") return 3;
  if (status === "OUT_FOR_DELIVERY") return 2;
  if (status === "PROCESSING") return 1;
  return 0;
}

export function getFriendlyStatusLabel(
  status: string,
  isPaid: boolean,
  deliveryMethod?: string
): string {
  if (status === "CANCELLED") return "Cancelled";
  if (status === "DELIVERED") {
    return deliveryMethod === "PICKUP" ? "Collected" : "Delivered";
  }
  if (status === "OUT_FOR_DELIVERY") {
    return deliveryMethod === "PICKUP" ? "Ready for Pickup" : "Out for Delivery";
  }
  if (status === "PROCESSING") return "Preparing";
  if (status === "PAID" || isPaid) return "Confirmed";
  return "Order Placed";
}

export function isOrderClosed(status: string): boolean {
  return status === "DELIVERED" || status === "CANCELLED";
}

export function isCustomerCancellable(status: string): boolean {
  return (
    status === "PENDING" ||
    status === "REVIEWING_DELIVERY" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAID" ||
    status === "PROCESSING"
  );
}

export function getOrderVisualProfile(input: {
  status: string;
  deliveryMethod: string;
  deliveryFee: number | null;
  preferredPaymentMethod: PaymentMethod | null;
  paymentStatus?: string | null;
}): OrderVisualProfile {
  const isPaid = input.paymentStatus === "VERIFIED";
  const isCancelled = input.status === "CANCELLED";
  const isDelivered = input.status === "DELIVERED";
  const isPaymentFailed = input.paymentStatus === "FAILED";
  const isAwaitingMpesa =
    !isPaid &&
    !isCancelled &&
    (input.preferredPaymentMethod === "MPESA_BUY_GOODS" ||
      input.preferredPaymentMethod === "BANK_TRANSFER");
  const isCashOnPickupPending =
    !isPaid && !isCancelled && input.preferredPaymentMethod === "CASH_ON_PICKUP";
  const isAwaitingDeliveryQuote =
    !isCancelled &&
    input.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
    input.deliveryFee === null;

  const statusLabel = getFriendlyStatusLabel(
    input.status,
    isPaid,
    input.deliveryMethod
  );
  const paymentLabel = formatWhatsappPaymentStatus({
    paymentStatus: input.paymentStatus,
    preferredPaymentMethod: input.preferredPaymentMethod,
    isPaid,
  });

  if (isCancelled) {
    return {
      tone: "alert",
      statusLabel,
      statusDescription: isPaid
        ? "This order was cancelled. Your M-Pesa payment was verified — message us on WhatsApp with your order number to arrange your refund."
        : "This order was cancelled. You can place a new order anytime.",
      paymentLabel: isPaid ? "Paid via M-Pesa (Refund pending)" : paymentLabel,
      paymentPaid: isPaid,
      paymentNeedsAttention: isPaid,
      headerSurfaceClass: "bg-rose-50/90",
      headerBorderClass: "border-rose-200/80",
      headerTitleClass: "text-rose-950",
      headerIconClass: "text-destructive",
      paymentTextClass: isPaid ? "text-amber-800" : "text-destructive",
      rowBadgeIconClass: "text-destructive bg-rose-50 border-rose-200",
      stepperAccentTone: "botanical",
    };
  }

  if (isDelivered) {
    return {
      tone: "delivered",
      statusLabel,
      statusDescription:
        input.deliveryMethod === "PICKUP"
          ? "Order collected. Thank you for choosing Nature's Nectar Wellness."
          : "Delivered and completed. Thank you for choosing Nature's Nectar Wellness.",
      paymentLabel,
      paymentPaid: isPaid,
      paymentNeedsAttention: false,
      headerSurfaceClass: "bg-emerald-50/90",
      headerBorderClass: "border-emerald-200/80",
      headerTitleClass: "text-emerald-950",
      headerIconClass: "text-primary",
      paymentTextClass: isPaid ? "text-primary" : "text-amber-800",
      rowBadgeIconClass: "text-primary bg-emerald-50 border-emerald-200",
      stepperAccentTone: "botanical",
    };
  }

  if (isPaymentFailed || isAwaitingMpesa) {
    return {
      tone: "amber",
      statusLabel: isPaymentFailed ? "Payment Failed" : statusLabel,
      statusDescription: isPaymentFailed
        ? "M-Pesa confirmation did not complete. Message us on WhatsApp if you need help."
        : "Waiting for M-Pesa payment confirmation before dispatch.",
      paymentLabel,
      paymentPaid: false,
      paymentNeedsAttention: true,
      headerSurfaceClass: "bg-amber-50/90",
      headerBorderClass: "border-amber-200/80",
      headerTitleClass: "text-amber-950",
      headerIconClass: "text-amber-700",
      paymentTextClass: isPaymentFailed ? "text-destructive" : "text-amber-800",
      rowBadgeIconClass: "text-amber-700 bg-amber-50 border-amber-200",
      stepperAccentTone: "amber",
    };
  }

  let statusDescription = "Your order is confirmed and in our fulfillment queue.";
  if (input.status === "OUT_FOR_DELIVERY") {
    statusDescription =
      input.deliveryMethod === "PICKUP"
        ? "Your formulation is packed and ready for collection."
        : "Your order is on the way with our delivery rider.";
  } else if (input.status === "PROCESSING") {
    statusDescription = "We are carefully preparing and packing your items.";
  } else if (isAwaitingDeliveryQuote) {
    statusDescription =
      "Order saved. Our team will confirm the countrywide delivery fee shortly.";
  } else if (isCashOnPickupPending) {
    statusDescription =
      "Order saved. Pay in cash when collecting your items.";
  }

  return {
    tone: "active",
    statusLabel,
    statusDescription,
    paymentLabel,
    paymentPaid: isPaid,
    paymentNeedsAttention: isCashOnPickupPending || isAwaitingDeliveryQuote,
    headerSurfaceClass: "bg-primary/[0.07]",
    headerBorderClass: "border-primary/15",
    headerTitleClass: "text-foreground",
    headerIconClass: "text-primary",
    paymentTextClass: isPaid ? "text-primary" : "text-amber-800",
    rowBadgeIconClass: "text-primary bg-primary/10 border-primary/20",
    stepperAccentTone: "botanical",
  };
}
