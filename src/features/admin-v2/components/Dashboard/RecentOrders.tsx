import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentOrders = [
  {
    orderNumber: "NNW-001",
    customer: "Kennedy Gitau",
    status: "Pending Payment",
  },
  {
    orderNumber: "NNW-002",
    customer: "John Doe",
    status: "Preparing",
  },
  {
    orderNumber: "NNW-003",
    customer: "Mary Wanjiku",
    status: "Ready for Pickup",
  },
];

export function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div
              key={order.orderNumber}
              className="flex items-center justify-between border-b pb-3 last:border-0"
            >
              <div>
                <p className="font-medium">
                  {order.orderNumber}
                </p>

                <p className="text-sm text-muted-foreground">
                  {order.customer}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm">
                  {order.status}
                </p>

                <button className="text-sm font-medium text-primary">
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}