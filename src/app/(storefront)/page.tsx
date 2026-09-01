import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:py-16">
      <div className="max-w-2xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Natural wellness, delivered with care
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Herbal products for everyday balance and wellbeing
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse teas, supplements, and natural health products. Order online and
          continue the conversation on WhatsApp — we confirm delivery and payment
          with you personally.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/products">Browse products</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/products">Shop wellness</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-6 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="font-medium">Trusted sourcing</h2>
          <p className="text-sm text-muted-foreground">
            Products selected for quality, clarity, and everyday wellness support.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-medium">WhatsApp-first ordering</h2>
          <p className="text-sm text-muted-foreground">
            Submit your order online, then confirm delivery and payment directly
            with us.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="font-medium">Delivery across Kenya</h2>
          <p className="text-sm text-muted-foreground">
            Pickup available, with flexible delivery pricing based on your location.
          </p>
        </div>
      </div>
    </section>
  );
}
