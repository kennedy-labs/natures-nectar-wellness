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

export type OrderTone = "attention" | "active" | "success" | "danger";

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

export function getAdminOrderStatusMeta(
  order: AdminOrder
): AdminOrderStatusMeta {
  const isPaid = order.payments?.some((p) => p.status === "VERIFIED") ?? false;
  const isCash =
    order.preferredPaymentMethod === "CASH_ON_PICKUP" ||
    order.preferredPaymentMethod === "CASH_ON_DELIVERY";
  const needsQuote =
    (order.status === "PENDING" || order.status === "REVIEWING_DELIVERY") &&
    order.deliveryMethod === "COUNTRYWIDE_DELIVERY" &&
    order.deliveryFee == null;

  switch (order.status) {
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
        label: "Completed",
        nextActionHint: "Delivered",
        guidance:
          "This order has been handed over to the customer and is complete.",
        tone: "success",
        stepIndex: 3,
      };
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery",
        nextActionHint: "Mark completed on handover",
        guidance:
          "With the rider or courier. Confirm completion once the customer receives their items.",
        tone: "active",
        stepIndex: 2,
      };
    case "PROCESSING":
      return {
        label: "Packing",
        nextActionHint: "Dispatch order",
        guidance:
          "Items are being packed. Move to Out for Delivery once handed to the rider or courier.",
        tone: "active",
        stepIndex: 2,
      };
    case "PAID":
      return {
        label: "Paid",
        nextActionHint: "Start packing",
        guidance:
          "Payment is confirmed. Start packing the items and prepare dispatch.",
        tone: "success",
        stepIndex: 1,
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Waiting for Payment",
        nextActionHint: "Verify M-Pesa / ref",
        guidance: isCash
          ? "Ready to pack. Collect cash on handover and verify payment."
          : "Waiting for the customer's payment. Verify the M-Pesa or bank reference once received.",
        tone: "attention",
        stepIndex: 1,
      };
    case "REVIEWING_DELIVERY":
      return {
        label: "Needs Delivery Quote",
        nextActionHint: "Set courier fee",
        guidance:
          "Countrywide courier selected. Set the delivery fee so the customer gets their final total.",
        tone: "attention",
        stepIndex: 0,
      };
    case "PENDING":
    default:
      if (needsQuote) {
        return {
          label: "Needs Delivery Quote",
          nextActionHint: "Set courier fee",
          guidance:
            "Countrywide courier selected. Set the delivery fee so the customer gets their final total.",
          tone: "attention",
          stepIndex: 0,
        };
      }
      if (isCash) {
        return {
          label: "New Cash Order",
          nextActionHint: "Start packing",
          guidance:
            "Customer will pay cash on pickup or delivery. You can pack and dispatch right away.",
          tone: "attention",
          stepIndex: 1,
        };
      }
      if (!isPaid) {
        return {
          label: "New Order",
          nextActionHint: "Confirm quote or payment",
          guidance:
            "Confirm delivery details or verify the customer's payment reference to move forward.",
          tone: "attention",
          stepIndex: 0,
        };
      }
      return {
        label: "New Order",
        nextActionHint: "Review & pack",
        guidance: "Review the order details and start packing.",
        tone: "active",
        stepIndex: 1,
      };
  }
}

export function getToneClasses(tone: OrderTone) {
  switch (tone) {
    case "success":
      return {
        text: "text-[#1F4E37]",
        subtleBg: "bg-[#1F4E37]/[0.07] border-[#1F4E37]/20",
      };
    case "attention":
      return {
        text: "text-amber-800",
        subtleBg: "bg-amber-50/90 border-amber-200/80",
      };
    case "danger":
      return {
        text: "text-destructive",
        subtleBg: "bg-destructive/[0.06] border-destructive/20",
      };
    case "active":
    default:
      return {
        text: "text-slate-800",
        subtleBg: "bg-[#F7F5F0] border-border",
      };
  }
}
