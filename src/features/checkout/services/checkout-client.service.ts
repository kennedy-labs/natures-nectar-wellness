import { submitCheckoutOrder } from "@/features/checkout/api/checkout-api";
import type { CheckoutFormValues } from "@/features/checkout/types/checkout.types";
import type { CartItem } from "@/store/cart.store";

export async function submitCheckout(
  values: CheckoutFormValues,
  cartItems: CartItem[]
) {
  const items = cartItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  return submitCheckoutOrder({
    customer: {
      name: values.customer.name.trim(),
      phone: values.customer.phone.trim(),
      email: values.customer.email?.trim() || undefined,
    },

    delivery: {
      method: values.delivery.method,
      location: values.delivery.location?.trim() || undefined,
      notes: values.delivery.notes?.trim() || undefined,
    },

    items,

    preferredPaymentMethod: values.preferredPaymentMethod ?? undefined,

    customerNotes: values.customerNotes?.trim() || undefined,
  });
}