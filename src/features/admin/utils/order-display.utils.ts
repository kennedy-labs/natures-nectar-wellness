import {
  getNextOrderAction,
  hasVerifiedPayment,
  isCashPaymentMethod,
  normalizeOrderStage,
  type OrderNextAction,
  type UnifiedOrderStage,
} from "@/features/orders/utils/order-workflow.utils";

export type AdminOrderPayment = {
  id: string;
  method:
    | "MPESA_BUY_GOODS"
    | "BANK_TRANSFER"
    | "CASH_ON_PICKUP"
    | "CASH_ON_DELIVERY";
  status:
    | "PENDING"
    | "AWAITING_VERIFICATION"
    | "VERIFIED"
    | "FAILED"
    | "REFUNDED";
  amount?: number | null;
  transactionRef?: string | null;
  verifiedAt?: Date | string | null;
};

export type AdminOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryMethod: string;
  deliveryLocation?: string | null;
  deliveryNotes?: string | null;
  deliveryFee?: number | null;
  deliveryQuoteNotes?: string | null;
  subtotalAmount: number;
  totalAmount?: number | null;
  preferredPaymentMethod?: string | null;
  customerNotes?: string | null;
  createdAt: Date | string;
  items?: AdminOrderItem[];
  payments?: AdminOrderPayment[];
};

export type OrderTone =
  | "attention"
  | "packing"
  | "dispatch"
  | "paid"
  | "success"
  | "danger"
  | "active";

export type AdminOrderStatusMeta = {
  label: string;
  nextActionHint: string;
  guidance: string;
  tone: OrderTone;
  stepIndex: number;
};

export type OrderStageDefinition = {
  key: UnifiedOrderStage;
  dbStatus: UnifiedOrderStage;
  label: string;
  shortMeaning: string;
  bucket: "undone" | "completed";
  urgency: "decision" | "fulfillment" | "done" | "closed";
  tone: OrderTone;
};

export const ORDER_STAGE_DEFINITIONS: readonly OrderStageDefinition[] = [
  {
    key: "REVIEWING_DELIVERY",
    dbStatus: "REVIEWING_DELIVERY",
    label: "Quote Needed",
    shortMeaning: "Courier fee pending",
    bucket: "undone",
    urgency: "decision",
    tone: "attention",
  },
  {
    key: "AWAITING_PAYMENT",
    dbStatus: "AWAITING_PAYMENT",
    label: "Awaiting Payment",
    shortMeaning: "Verify M-Pesa / Bank",
    bucket: "undone",
    urgency: "decision",
    tone: "attention",
  },
  {
    key: "PROCESSING",
    dbStatus: "PROCESSING",
    label: "Preparing",
    shortMeaning: "Ready to pack",
    bucket: "undone",
    urgency: "fulfillment",
    tone: "packing",
  },
  {
    key: "OUT_FOR_DELIVERY",
    dbStatus: "OUT_FOR_DELIVERY",
    label: "Ready / Dispatched",
    shortMeaning: "Pickup or with rider",
    bucket: "undone",
    urgency: "fulfillment",
    tone: "dispatch",
  },
  {
    key: "DELIVERED",
    dbStatus: "DELIVERED",
    label: "Delivered",
    shortMeaning: "Handed over & done",
    bucket: "completed",
    urgency: "done",
    tone: "success",
  },
  {
    key: "CANCELLED",
    dbStatus: "CANCELLED",
    label: "Cancelled",
    shortMeaning: "Closed & restocked",
    bucket: "completed",
    urgency: "closed",
    tone: "danger",
  },
] as const;

export function isUndoneOrderStage(stage: UnifiedOrderStage): boolean {
  return stage !== "DELIVERED" && stage !== "CANCELLED";
}

export function isDecisionRequiredStage(stage: UnifiedOrderStage): boolean {
  return stage === "REVIEWING_DELIVERY" || stage === "AWAITING_PAYMENT";
}

export function getPrimaryActionButtonClasses(action: OrderNextAction): string {
  if (action.kind === "open_quote" || action.kind === "open_payment") {
    return "border-[#B45309] bg-[#B45309] text-white hover:bg-[#92400E] focus-visible:ring-[#B45309]/40";
  }
  return "border-[#1F4E37] bg-[#1F4E37] text-[#FCFBF8] hover:bg-[#173B2A] focus-visible:ring-[#1F4E37]/40";
}

export function toWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith("7") || digits.startsWith("1")) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

export function getAdminDeliveryLabel(method: string): string {
  switch (method) {
    case "PICKUP":
      return "Shop Pickup";
    case "LOCAL_DELIVERY":
      return "Nairobi Delivery";
    case "COUNTRYWIDE_DELIVERY":
      return "Countrywide Courier";
    default:
      return method.replace(/_/g, " ");
  }
}

export function getAdminPaymentMethodLabel(method?: string | null): string {
  switch (method) {
    case "MPESA_BUY_GOODS":
      return "M-Pesa";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CASH_ON_PICKUP":
      return "Cash on Pickup";
    case "CASH_ON_DELIVERY":
      return "Cash on Delivery";
    default:
      return method ? method.replace(/_/g, " ") : "Not set";
  }
}

export function getAdminPaymentStatusLabel(status?: string | null): string {
  switch (status) {
    case "VERIFIED":
      return "Paid & Verified";
    case "AWAITING_VERIFICATION":
      return "Needs Verification";
    case "PENDING":
      return "Unpaid";
    case "FAILED":
      return "Voided";
    case "REFUNDED":
      return "Refunded";
    default:
      return status ? status.replace(/_/g, " ") : "Unpaid";
  }
}

export function formatAdminOrderDate(rawDate: Date | string): string {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const time = date.toLocaleTimeString("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date >= startOfToday) {
    return `Today, ${time}`;
  }
  if (date >= startOfYesterday) {
    return `Yesterday, ${time}`;
  }

  return date.toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getAdminOrderTotal(order: AdminOrder): number {
  return order.totalAmount ?? order.subtotalAmount + (order.deliveryFee ?? 0);
}

export type AdminOrderCategory = UnifiedOrderStage;

export function getAdminOrderCategory(order: AdminOrder): AdminOrderCategory {
  return normalizeOrderStage(order);
}

export function getAdminOrderStatusMeta(
  order: AdminOrder
): AdminOrderStatusMeta {
  const stage = normalizeOrderStage(order);
  const isPaid = hasVerifiedPayment(order);
  const isCash = isCashPaymentMethod(order.preferredPaymentMethod);
  const nextAction = getNextOrderAction(order);

  switch (stage) {
    case "CANCELLED":
      return {
        label: "Cancelled",
        nextActionHint: "Closed",
        guidance:
          "This order was cancelled and reserved product stock has been returned to inventory.",
        tone: "danger",
        stepIndex: 0,
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        nextActionHint: "Completed",
        guidance:
          "This order has been handed over to the customer and is complete.",
        tone: "success",
        stepIndex: 3,
      };
    case "OUT_FOR_DELIVERY":
      return {
        label:
          order.deliveryMethod === "PICKUP"
            ? "Ready for Pickup"
            : "Out for Delivery",
        nextActionHint: nextAction?.label ?? "Mark Delivered",
        guidance:
          order.deliveryMethod === "PICKUP"
            ? isCash && !isPaid
              ? "Packed and waiting at the counter. Collect cash payment and mark delivered on handover."
              : "Packed and waiting at the shop counter for customer collection."
            : isCash && !isPaid
              ? "With the rider or courier. Collecting delivery confirmation also verifies the cash payment."
              : "With the rider or courier. Mark delivered once the customer receives their items.",
        tone: "dispatch",
        stepIndex: 2,
      };
    case "PROCESSING":
      return {
        label: "Preparing",
        nextActionHint: nextAction?.label ?? "Out for Delivery",
        guidance:
          order.deliveryMethod === "PICKUP"
            ? "Confirmed and ready to pack. Mark Ready for Pickup once waiting at the counter."
            : "Confirmed and ready to pack. Mark Out for Delivery once handed to the rider or courier.",
        tone: "packing",
        stepIndex: 1,
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Awaiting Payment",
        nextActionHint: nextAction?.label ?? "Verify Payment",
        guidance:
          "Waiting for M-Pesa or bank payment confirmation before packing begins.",
        tone: "attention",
        stepIndex: 0,
      };
    case "REVIEWING_DELIVERY":
      return {
        label: "Quote Needed",
        nextActionHint: nextAction?.label ?? "Set Delivery Quote",
        guidance: isCash
          ? "Countrywide courier selected. Set the courier fee to move this order to Preparing."
          : "Countrywide courier selected. Set the courier fee so the customer can complete payment.",
        tone: "attention",
        stepIndex: 0,
      };
  }
}

export function getToneClasses(tone: OrderTone) {
  switch (tone) {
    case "success":
      return {
        text: "text-[#1F4E37]",
        badgeClass:
          "border-[#1F4E37]/30 bg-[#1F4E37]/10 text-[#1F4E37]",
        subtleBg: "bg-[#1F4E37]/[0.07] border-[#1F4E37]/25",
        activeStageClass:
          "bg-[#1F4E37]/[0.09] ring-1 ring-inset ring-[#1F4E37]/40",
        countClass: "text-[#1F4E37]",
        tabActiveClass: "bg-[#1F4E37] text-[#FCFBF8]",
      };
    case "paid":
      return {
        text: "text-[#1F4E37]",
        badgeClass:
          "border-[#1F4E37]/30 bg-[#1F4E37]/10 text-[#1F4E37]",
        subtleBg: "bg-[#1F4E37]/[0.07] border-[#1F4E37]/25",
        activeStageClass:
          "bg-[#1F4E37]/[0.09] ring-1 ring-inset ring-[#1F4E37]/40",
        countClass: "text-[#1F4E37]",
        tabActiveClass: "bg-[#1F4E37] text-[#FCFBF8]",
      };
    case "packing":
      return {
        text: "text-[#075985]",
        badgeClass: "border-[#0284C7]/30 bg-[#F0F9FF] text-[#075985]",
        subtleBg: "bg-[#F0F9FF] border-[#0284C7]/25",
        activeStageClass:
          "bg-[#F0F9FF] ring-1 ring-inset ring-[#0284C7]/45",
        countClass: "text-[#0369A1]",
        tabActiveClass: "bg-[#0369A1] text-white",
      };
    case "dispatch":
      return {
        text: "text-[#3730A3]",
        badgeClass: "border-[#4F46E5]/30 bg-[#EEF2FF] text-[#3730A3]",
        subtleBg: "bg-[#EEF2FF] border-[#4F46E5]/25",
        activeStageClass:
          "bg-[#EEF2FF] ring-1 ring-inset ring-[#4F46E5]/45",
        countClass: "text-[#3730A3]",
        tabActiveClass: "bg-[#3730A3] text-white",
      };
    case "attention":
      return {
        text: "text-[#92400E]",
        badgeClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
        subtleBg: "bg-[#FFFBEB] border-[#F59E0B]/30",
        activeStageClass:
          "bg-[#FFFBEB] ring-1 ring-inset ring-[#D97706]/50",
        countClass: "text-[#B45309]",
        tabActiveClass: "bg-[#B45309] text-white",
      };
    case "danger":
      return {
        text: "text-[#991B1B]",
        badgeClass: "border-[#DC2626]/25 bg-[#FEF2F2] text-[#991B1B]",
        subtleBg: "bg-[#FEF2F2] border-[#DC2626]/20",
        activeStageClass:
          "bg-[#FEF2F2] ring-1 ring-inset ring-[#DC2626]/40",
        countClass: "text-[#B91C1C]",
        tabActiveClass: "bg-[#B91C1C] text-white",
      };
    case "active":
    default:
      return {
        text: "text-[#14221B]",
        badgeClass: "border-[#E3DFD6] bg-[#F7F5F0] text-[#14221B]",
        subtleBg: "bg-[#F7F5F0] border-[#E3DFD6]",
        activeStageClass:
          "bg-[#F7F5F0] ring-1 ring-inset ring-[#14221B]/25",
        countClass: "text-[#14221B]",
        tabActiveClass: "bg-[#14221B] text-[#FCFBF8]",
      };
  }
}
