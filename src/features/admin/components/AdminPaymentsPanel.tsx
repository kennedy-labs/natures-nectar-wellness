"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  method: string;
  transactionRef: string | null;
  verifiedAt: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  payments?: Payment[];
};

export function AdminPaymentsPanel() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();

    setOrders(data?.data ?? data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="space-y-3">
      {orders.map((order) =>
        order.payments?.map((payment) => (
          <div
            key={payment.id}
            className="border rounded-md p-3"
          >
            <p className="font-medium">{order.orderNumber}</p>
            <p className="text-sm">{payment.method}</p>
            <div className="text-sm space-y-1">
  <p>Status: {payment.status}</p>
  <p>Reference: {payment.transactionRef ?? "—"}</p>
  <p>Verified: {payment.verifiedAt ?? "—"}</p>
</div>
          </div>
        ))
      )}
    </div>
  );
}