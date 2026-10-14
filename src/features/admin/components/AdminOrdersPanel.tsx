"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotalAmount: number;
  deliveryFee?: number | null;
  payments?: Payment[];
};

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<{ fee: string; notes: string }>({ fee: "", notes: "" });

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data?.data ?? data);
    setLoading(false);
  }

  async function confirmDelivery(orderId: string) {
    const fee = parseFloat(quote.fee);
    if (isNaN(fee)) return alert("Invalid fee");

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee, notes: quote.notes }),
    });

    if (!res.ok) return alert("Failed to confirm");
    await load();
  }

  async function update(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    await load();
  }

  async function verifyPayment(paymentId: string, orderId: string) {
    await fetch(`/api/payments/${paymentId}/verify`, { method: "PATCH" });
    await update(orderId, "PAID");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {orders.map((order) => {
        const payment = order.payments?.[0];
        const paymentStatus = payment?.status;

        return (
          <div key={order.id} className="border rounded-md p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {order.status}
                </p>
        <p className="text-xs font-semibold">
                  Subtotal: {order.subtotalAmount.toFixed(2)}
                  {order.deliveryFee ? ` + Delivery: ${order.deliveryFee.toFixed(2)}` : ""}
                  {order.deliveryFee ? ` = Total: ${(order.subtotalAmount + order.deliveryFee).toFixed(2)}` : ""}
                </p>
              </div>

              <div className="text-xs">
                {paymentStatus && (
                  <span className={paymentStatus === 'VERIFIED' ? 'text-green-600' : 'text-amber-600'}>
                    {paymentStatus}
                  </span>
                )}
              </div>
            </div>

            {order.status === "PENDING" && (
                <div className="mt-4 border-t pt-2 space-y-2">
                    <input 
                        type="number" 
                        placeholder="Delivery Fee"
                        className="text-xs border p-1 w-full"
                        onChange={(e) => setQuote(prev => ({...prev, fee: e.target.value}))}
                    />
                    <input 
                        type="text" 
                        placeholder="Notes"
                        className="text-xs border p-1 w-full"
                        onChange={(e) => setQuote(prev => ({...prev, notes: e.target.value}))}
                    />
                    <button 
                        onClick={() => confirmDelivery(order.id)}
                        className="text-xs bg-primary text-white px-2 py-1 rounded w-full"
                    >
                        Confirm Delivery Quote
                    </button>
                </div>
            )}

            <div className="flex gap-2 mt-2">
              {paymentStatus === "PENDING" && payment && (
                <button
                  type="button"
                  onClick={() => verifyPayment(payment.id, order.id)}
                  className="text-xs border px-2 py-1 rounded bg-green-50"
                >
                  Verify & Mark Paid
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}