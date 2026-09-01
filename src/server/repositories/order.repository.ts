import { db } from "@/server/db/prisma";
import { SubmitOrderInput } from "@/features/orders/validations/order.validation";

export type CreateOrderRequestData = SubmitOrderInput & {
orderNumber: string;
subtotalAmount: number;
whatsappMessage: string;
items: Array<{
productId: string;
productName: string;
productSlug: string;
quantity: number;
priceAtPurchase: number;
lineTotal: number;
}>;
};

export async function createOrderRequest(data: CreateOrderRequestData) {
return db.$transaction(async (transaction) => {
for (const item of data.items) {
await transaction.product.update({
where: {
id: item.productId,
},
data: {
stockQuantity: {
decrement: item.quantity,
},
},
});
}

const customer = await transaction.customer.create({
  data: {
    name: data.customer.name,
    phone: data.customer.phone,
    email: data.customer.email,
  },
});

const order = await transaction.order.create({
  include: {
    customer: true,
    items: true,
    payments: true,
  },
  data: {
    orderNumber: data.orderNumber,
    customerId: customer.id,
    customerName: data.customer.name,
    customerPhone: data.customer.phone,
    customerEmail: data.customer.email,
    deliveryMethod: data.delivery.method,
    deliveryLocation: data.delivery.location,
    deliveryNotes: data.delivery.notes,
    subtotalAmount: data.subtotalAmount,
    preferredPaymentMethod: data.preferredPaymentMethod,
    customerNotes: data.customerNotes,
    whatsappMessage: data.whatsappMessage,
    items: {
      create: data.items,
    },
  },
});

await transaction.orderStatusHistory.create({
  data: {
    orderId: order.id,
    status: "PENDING",
  },
});

if (data.preferredPaymentMethod) {
  await transaction.payment.create({
    data: {
      orderId: order.id,
      method: data.preferredPaymentMethod,
      status: "PENDING",
    },
  });
}

return transaction.order.findUnique({
  where: {
    id: order.id,
  },
  include: {
    customer: true,
    items: true,
    payments: true,
  },
});

});
}