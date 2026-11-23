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
    latitude?: number;
    longitude?: number;
  };

  preferredPaymentMethod?: PaymentMethod;

  customerNotes?: string;
};

export type CheckoutSubmitResponse = {
  id: string;
  orderNumber: string;
  whatsappMessage: string;
  subtotalAmount: number;
  totalAmount?: number | null;
  customerPhone: string;
  customerEmail?: string | null;
  preferredPaymentMethod?: PaymentMethod | null;
};

export type GatewayAvailability = {
  darajaEnabled: boolean;
  paystackEnabled: boolean;
  darajaEnv: "sandbox" | "production";
};

export type PaystackReturnParams = {
  reference: string;
  orderId: string;
  orderNumber: string;
};

export type MpesaStkInitiateResponse = {
  paymentId: string;
  checkoutRequestId: string;
  merchantRequestId: string | null;
  customerMessage: string;
  amount: number;
  phone: string;
};

export type PaymentStatusPollResponse = {
  orderStatus: string;
  paymentStatus:
    | "PENDING"
    | "AWAITING_VERIFICATION"
    | "VERIFIED"
    | "FAILED"
    | "REFUNDED";
  transactionRef: string | null;
  amount: number;
  message: string;
};

export type PaystackInitializeResponse = {
  reference: string;
  authorizationUrl: string;
  accessCode: string | null;
  amount: number;
};

export type PaystackVerifyResponse = {
  orderNumber: string;
  whatsappMessage: string;
  paymentStatus: "VERIFIED";
  transactionRef: string | null;
  amount: number;
};

export type CheckoutSubmissionState =
  | "idle"
  | "submitting"
  | "success"
  | "error";