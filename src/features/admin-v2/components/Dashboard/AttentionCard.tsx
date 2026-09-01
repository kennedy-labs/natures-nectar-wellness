type AttentionCardProps = {
  title: string;
  count: number;
  description: string;
};

export function AttentionCard({
  title,
  count,
  description,
}: AttentionCardProps) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-sm font-medium">
        {title}
      </h2>

      <p className="mt-2 text-3xl font-bold">
        {count}
      </p>

      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}