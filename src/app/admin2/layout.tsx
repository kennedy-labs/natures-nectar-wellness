import type { Metadata } from "next";

import { requireAdminPage } from "@/server/auth/admin-auth";

export const metadata: Metadata = {
  title: "Admin V2",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminV2Layout({
    children,
}: {
    children: React.ReactNode
}) {
    await requireAdminPage();

    return (
        <main>
            <header>
                <h1>Nature&apos;s Nectar Admin V2</h1>
            </header>
            <hr/>
            {children}
        </main>
    );
}