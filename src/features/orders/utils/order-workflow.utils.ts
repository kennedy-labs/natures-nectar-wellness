export const UNIFIED_ORDER_STAGES = [
  "REVIEWING_DELIVERY",
  "AWAITING_PAYMENT",
  "PROCESSING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type UnifiedOrderStage = (typeof UNIFIED_ORDER_STAGES)[number];

export type OrderWorkflowSubject = {
  status: string;
  deliveryMethod: string;
  deliveryFee?: number | null;
  preferredPaymentMethod?: string | null;
  payments?: Array<{ status: string }> | null;
};

export type OrderNextAction =
  | {
      kind: "open_quote";
      label: string;
      focusSection: "quote";
    }
  | {
      kind: "open_payment";
      label: string;
      focusSection: "payment";
    }
  | {
      kind: "transition";
      targetStatus: "OUT_FOR_DELIVERY" | "DELIVERED";
      label: string;
      autoVerifiesCash: boolean;
    };

export function isCashPaymentMethod(method?: string | null): boolean {
  return method === "CASH_ON_PICKUP" || method === "CASH_ON_DELIVERY";
}

export function isUpfrontDigitalPaymentMethod(method?: string | null): boolean {
  return method === "MPESA_BUY_GOODS" || method === "BANK_TRANSFER";
}

export function hasVerifiedPayment(
  order: Pick<OrderWorkflowSubject, "payments">
): boolean {
  return order.payments?.some((p) => p.status === "VERIFIED") ?? false;
}

/**
 * Normalizes any persisted order status (including legacy PENDING / PAID rows)
 * into the canonical 6-state lifecycle model.
 */
export function normalizeOrderStage(
  order: OrderWorkflowSubject
): UnifiedOrderStage {
  switch (order.status) {
    case "CANCELLED":
      return "CANCELLED";
    case "DELIVERED":
      return "DELIVERED";
    case "OUT_FOR_DELIVERY":
      return "OUT_FOR_DELIVERY";
    case "REVIEWING_DELIVERY":
      return "REVIEWING_DELIVERY";
    case "AWAITING_PAYMENT":
      return hasVerifiedPayment(order) ||
        isCashPaymentMethod(order.preferredPaymentMethod)
        ? "PROCESSING"
        : "AWAITING_PAYMENT";
    case "PROCESSING":
    case "PAID":
      return "PROCESSING";
    case "PENDING": {
      const paid = hasVerifiedPayment(order);
      if (
        order.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
        order.deliveryFee == null &&
        !paid
      ) {
        return "REVIEWING_DELIVERY";
      }
      if (!paid && isUpfrontDigitalPaymentMethod(order.preferredPaymentMethod)) {
        return "AWAITING_PAYMENT";
      }
      return "PROCESSING";
    }
    default:
      return !hasVerifiedPayment(order) &&
        isUpfrontDigitalPaymentMethod(order.preferredPaymentMethod)
        ? "AWAITING_PAYMENT"
        : "PROCESSING";
  }
}

export function getInitialOrderStatus(input: {
  deliveryMethod: string;
  preferredPaymentMethod?: string | null;
}): "REVIEWING_DELIVERY" | "AWAITING_PAYMENT" | "PROCESSING" {
  // Instant Daraja STK checkout holds stock in AWAITING_PAYMENT until paid or released
  if (input.preferredPaymentMethod === "MPESA_BUY_GOODS") {
    return "AWAITING_PAYMENT";
  }

  if (input.deliveryMethod === "COUNTRYWIDE_DELIVERY") {
    return "REVIEWING_DELIVERY";
  }

  if (isUpfrontDigitalPaymentMethod(input.preferredPaymentMethod)) {
    return "AWAITING_PAYMENT";
  }

  return "PROCESSING";
}

export function getQuoteNextStatus(
  order: OrderWorkflowSubject
): "AWAITING_PAYMENT" | "PROCESSING" | "OUT_FOR_DELIVERY" {
  const stage = normalizeOrderStage(order);

  if (stage === "OUT_FOR_DELIVERY") {
    return "OUT_FOR_DELIVERY";
  }

  if (stage === "PROCESSING" || hasVerifiedPayment(order)) {
    return "PROCESSING";
  }

  if (isCashPaymentMethod(order.preferredPaymentMethod)) {
    return "PROCESSING";
  }

  return "AWAITING_PAYMENT";
}

export function getNextOrderAction(
  order: OrderWorkflowSubject
): OrderNextAction | null {
  const stage = normalizeOrderStage(order);

  switch (stage) {
    case "REVIEWING_DELIVERY":
      return {
        kind: "open_quote",
        label: "Set Delivery Quote",
        focusSection: "quote",
      };
    case "AWAITING_PAYMENT":
      return {
        kind: "open_payment",
        label: "Verify Payment",
        focusSection: "payment",
      };
    case "PROCESSING":
      return {
        kind: "transition",
        targetStatus: "OUT_FOR_DELIVERY",
        label:
          order.deliveryMethod === "PICKUP"
            ? "Ready for Pickup"
            : "Out for Delivery",
        autoVerifiesCash: false,
      };
    case "OUT_FOR_DELIVERY":
      return {
        kind: "transition",
        targetStatus: "DELIVERED",
        label: "Mark Delivered",
        autoVerifiesCash:
          isCashPaymentMethod(order.preferredPaymentMethod) &&
          !hasVerifiedPayment(order),
      };
    case "DELIVERED":
    case "CANCELLED":
    default:
      return null;
  }
}

export type TransitionCheckResult =
  | { ok: true; nextStatus: UnifiedOrderStage }
  | { ok: false; code: string; message: string };

export function canTransitionOrderStatus(
  order: OrderWorkflowSubject,
  targetStatus: string
): TransitionCheckResult {
  const currentStage = normalizeOrderStage(order);
  const paid = hasVerifiedPayment(order);
  const isCash = isCashPaymentMethod(order.preferredPaymentMethod);

  if (currentStage === "CANCELLED") {
    return {
      ok: false,
      code: "ORDER_CANCELLED",
      message: "Cancelled orders cannot be transitioned to another status.",
    };
  }

  if (currentStage === "DELIVERED" && targetStatus !== "DELIVERED") {
    return {
      ok: false,
      code: "ORDER_ALREADY_DELIVERED",
      message: "Delivered orders cannot be moved backward.",
    };
  }

  if (targetStatus === "CANCELLED") {
    return { ok: true, nextStatus: "CANCELLED" };
  }

  if (currentStage === "REVIEWING_DELIVERY") {
    return {
      ok: false,
      code: "DELIVERY_QUOTE_REQUIRED",
      message:
        "Set the countrywide delivery quote before advancing this order.",
    };
  }

  if (currentStage === "AWAITING_PAYMENT" && !paid && !isCash) {
    return {
      ok: false,
      code: "PAYMENT_REQUIRED",
      message:
        "Payment must be verified before preparing or dispatching this order.",
    };
  }

  if (targetStatus === "OUT_FOR_DELIVERY") {
    if (currentStage !== "PROCESSING") {
      return {
        ok: false,
        code: "INVALID_TRANSITION",
        message: "Order must be in Preparing stage before dispatch or pickup readiness.",
      };
    }
    return { ok: true, nextStatus: "OUT_FOR_DELIVERY" };
  }

  if (targetStatus === "DELIVERED") {
    if (currentStage === "DELIVERED") {
      return { ok: true, nextStatus: "DELIVERED" };
    }
    if (currentStage !== "OUT_FOR_DELIVERY") {
      return {
        ok: false,
        code: "DISPATCH_REQUIRED",
        message:
          order.deliveryMethod === "PICKUP"
            ? "Mark the order Ready for Pickup before marking it delivered."
            : "Mark the order Out for Delivery before marking it delivered.",
      };
    }
    return { ok: true, nextStatus: "DELIVERED" };
  }

  return {
    ok: false,
    code: "INVALID_STATUS",
    message: "Order status transition is not allowed.",
  };
}
