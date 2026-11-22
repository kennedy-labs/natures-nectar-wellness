import type { Metadata } from "next";
import { requireAdminPage } from "@/server/auth/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <>{children}</>;
}
