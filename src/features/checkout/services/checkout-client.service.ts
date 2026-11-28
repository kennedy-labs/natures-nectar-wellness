import { submitCheckoutOrder } from "@/features/checkout/api/checkout-api";
import type { CheckoutFormValues } from "@/features/checkout/types/checkout.types";
import type { CartItem } from "@/store/cart.store";

export async function submitCheckout(
  values: CheckoutFormValues,
  cartItems: CartItem[]
) {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("You cannot proceed to checkout when your cart is empty.");
  }

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
      latitude:
        typeof values.delivery.latitude === "number" &&
        Number.isFinite(values.delivery.latitude)
          ? values.delivery.latitude
          : undefined,
      longitude:
        typeof values.delivery.longitude === "number" &&
        Number.isFinite(values.delivery.longitude)
          ? values.delivery.longitude
          : undefined,
    },

    items,

    preferredPaymentMethod: values.preferredPaymentMethod ?? undefined,

    customerNotes: values.customerNotes?.trim() || undefined,
  });
}