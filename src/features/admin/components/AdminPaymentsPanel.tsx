"use client";

import { useEffect, useState } from "react";

import { AdminPaymentsSkeleton } from "@/components/skeletons/AdminSkeletons";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setOrders(data?.data ?? data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <AdminPaymentsSkeleton />;
  }

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