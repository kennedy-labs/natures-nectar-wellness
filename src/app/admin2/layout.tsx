import { requireAdminPage } from "@/server/auth/admin-auth";

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