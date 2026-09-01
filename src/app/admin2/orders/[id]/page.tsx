type Admin2OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Admin2OrderDetailPage({
  params,
}: Admin2OrderDetailPageProps) {
  const { id } = await params;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Order {id}</h1>
      <p className="mt-2 text-muted-foreground">Order details are coming soon.</p>
    </main>
  );
}
