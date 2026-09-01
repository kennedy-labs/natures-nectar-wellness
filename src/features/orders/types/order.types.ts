export type OrderStatus =
  | "PENDING"
  | "REVIEWING_DELIVERY"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type DeliveryMethod =
  | "PICKUP"
  | "LOCAL_DELIVERY"
  | "COUNTRYWIDE_DELIVERY";

export type PaymentMethod =
  | "MPESA_BUY_GOODS"
  | "BANK_TRANSFER"
  | "CASH_ON_PICKUP"
  | "CASH_ON_DELIVERY";

export type PaymentStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "VERIFIED"
  | "FAILED"
  | "REFUNDED";
