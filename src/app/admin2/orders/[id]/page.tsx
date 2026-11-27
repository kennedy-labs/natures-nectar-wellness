import { permanentRedirect } from "next/navigation";

export default function Admin2OrderDetailPage() {
  permanentRedirect("/admin?tab=orders");
}
