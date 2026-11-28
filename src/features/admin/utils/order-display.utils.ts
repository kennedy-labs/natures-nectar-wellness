import {
  getNextOrderAction,
  hasVerifiedPayment,
  isCashPaymentMethod,
  normalizeOrderStage,
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
          "border-[#1F4E37]/25 bg-[#1F4E37]/10 text-[#1F4E37]",
        subtleBg: "bg-[#1F4E37]/[0.07] border-[#1F4E37]/20",
      };
    case "paid":
      return {
        text: "text-emerald-800",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
        subtleBg: "bg-emerald-50/80 border-emerald-200/80",
      };
    case "packing":
      return {
        text: "text-sky-800",
        badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
        subtleBg: "bg-sky-50/80 border-sky-200/80",
      };
    case "dispatch":
      return {
        text: "text-indigo-800",
        badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
        subtleBg: "bg-indigo-50/80 border-indigo-200/80",
      };
    case "attention":
      return {
        text: "text-amber-800",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        subtleBg: "bg-amber-50/90 border-amber-200/80",
      };
    case "danger":
      return {
        text: "text-rose-700",
        badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
        subtleBg: "bg-rose-50/80 border-rose-200/80",
      };
    case "active":
    default:
      return {
        text: "text-slate-700",
        badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
        subtleBg: "bg-[#F7F5F0] border-border",
      };
  }
}
