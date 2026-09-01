import { SubmitOrderInput } from "@/features/orders/validations/order.validation";

export function createOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `NNW-${timestamp}-${suffix}`;
}

type WhatsappOrderItem = {
  name: string;
  quantity: number;
  lineTotal: number;
};

export function createWhatsappOrderMessage({
  orderNumber,
  customer,
  delivery,
  items,
  subtotalAmount,
}: {
  orderNumber: string;
  customer: SubmitOrderInput["customer"];
  delivery: SubmitOrderInput["delivery"];
  items: WhatsappOrderItem[];
  subtotalAmount: number;
}) {
  const itemLines = items
    .map((item) => `- ${item.name} x${item.quantity}: KES ${item.lineTotal}`)
    .join("\n");

  return [
    `New order request: ${orderNumber}`,
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Delivery: ${delivery.method}`,
    delivery.location ? `Location: ${delivery.location}` : null,
    delivery.notes ? `Notes: ${delivery.notes}` : null,
    "Items:",
    itemLines,
    `Subtotal: KES ${subtotalAmount}`,
    "Delivery fee: to be confirmed",
  ]
    .filter(Boolean)
    .join("\n");
}
