export const DELIVERY_METHODS = [
  "PICKUP",
  "LOCAL_DELIVERY",
  "COUNTRYWIDE_DELIVERY",
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const PAYMENT_METHODS = [
  "MPESA_BUY_GOODS",
  "BANK_TRANSFER",
  "CASH_ON_PICKUP",
  "CASH_ON_DELIVERY",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type CheckoutFormValues = {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };

  delivery: {
    method: DeliveryMethod;
    location?: string;
    notes?: string;
  };

  preferredPaymentMethod?: PaymentMethod;

  customerNotes?: string;
};

export type CheckoutSubmitResponse = {
  id: string;
  orderNumber: string;
  whatsappMessage: string;
};

export type CheckoutSubmissionState =
  | "idle"
  | "submitting"
  | "success"
  | "error";