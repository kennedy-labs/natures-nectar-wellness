import type { Metadata } from "next";

import { AdminLoginForm } from "@/features/admin/components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <AdminLoginForm />
    </main>
  );
}
