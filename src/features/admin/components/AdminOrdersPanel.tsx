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
  payments?: Payment[];
};

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data?.data ?? data);
    setLoading(false);
  }

  async function update(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    console.log("STATUS:", res.status);

    const body = await res.json();
    console.log("BODY:", body);

    await load();
  }

  async function verifyPayment(paymentId: string) {
    await fetch(`/api/payments/${paymentId}/verify`, {
      method: "PATCH",
    });

    await load();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const payment = order.payments?.[0];
        const paymentStatus = payment?.status;

        return (
          <div key={order.id} className="border rounded-md p-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {order.status}
                </p>
              </div>

              <div className="text-xs">
                {paymentStatus === "VERIFIED" && (
                  <span className="text-green-600">VERIFIED</span>
                )}

                {paymentStatus === "PENDING" && (
                  <span className="text-amber-600">PENDING</span>
                )}

                {paymentStatus === "FAILED" && (
                  <span className="text-red-600">FAILED</span>
                )}

                {!paymentStatus && (
                  <span className="text-muted-foreground">
                    NO PAYMENT
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {paymentStatus === "PENDING" && payment && (
                <button
                  type="button"
                  onClick={() => verifyPayment(payment.id)}
                  className="text-xs border px-2 py-1 rounded bg-green-50"
                >
                  Verify Payment
                </button>
              )}

              <button
                type="button"
                onClick={() => update(order.id, "PAID")}
                disabled={paymentStatus !== "VERIFIED"}
                className="text-xs border px-2 py-1 rounded disabled:opacity-50"
              >
                PAID
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}