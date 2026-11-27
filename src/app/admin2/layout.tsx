import type { Metadata } from "next";

import { requireAdminPage } from "@/server/auth/admin-auth";

export const metadata: Metadata = {
  title: "Admin Redirect",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <>{children}</>;
}