import { permanentRedirect } from "next/navigation";

export default function Admin2OrdersPage() {
  permanentRedirect("/admin?tab=orders");
}
