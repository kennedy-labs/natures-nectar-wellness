import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";

type PolicyPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  whatsappMessage: string;
  children: React.ReactNode;
};

export function PolicyPageShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  whatsappMessage,
  children,
}: PolicyPageShellProps) {
  const whatsappUrl = getWhatsAppUrl(whatsappMessage);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <WhatsAppPageContext message={whatsappMessage} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">{title}</span>
      </nav>

      <header className="space-y-3 border-b border-border/80 pb-6">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {summary}
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {children}
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-medium text-foreground">
            Questions about this policy?
          </h2>
          <p className="text-sm text-muted-foreground">
            Reach our team directly on WhatsApp for quick clarification.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          {whatsappUrl ? (
            <Button asChild className="min-h-10 w-full sm:w-auto">
              <a href={whatsappUrl} rel="noopener noreferrer" target="_blank">
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="min-h-10 w-full sm:w-auto">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
