"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Temporary issue
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>

      <p className="mt-3 text-sm text-muted-foreground">
        We ran into an unexpected problem loading this page. Your cart and
        submitted orders are safe—please try refreshing below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>

        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return home
          </Link>
        </Button>
      </div>
    </main>
  );
}
