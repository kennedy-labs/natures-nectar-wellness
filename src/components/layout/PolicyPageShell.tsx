import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { WhatsAppPageContext } from "@/components/layout/WhatsAppContext";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";

export type PolicyHighlight = {
  label: string;
  value: string;
};

export type PolicySectionLink = {
  id: string;
  title: string;
};

type PolicyPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  whatsappMessage: string;
  highlights?: PolicyHighlight[];
  callout?: {
    title: string;
    body: string;
  };
  sections?: PolicySectionLink[];
  children: React.ReactNode;
};

export function PolicyPageShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  whatsappMessage,
  highlights,
  callout,
  sections,
  children,
}: PolicyPageShellProps) {
  const whatsappUrl = getWhatsAppUrl(whatsappMessage);
  const hasRail =
    (highlights && highlights.length > 0) ||
    Boolean(callout) ||
    (sections && sections.length > 0);

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
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

      <header className="space-y-3 border-b border-border pb-7">
        <p className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {summary}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Last updated: {lastUpdated}
        </p>
      </header>

      <div className={hasRail ? "mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12" : "mt-8"}>
        {hasRail ? (
          <aside className="space-y-5 lg:col-span-4">
            <div className="space-y-5 lg:sticky lg:top-24">
              {highlights && highlights.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
                    Quick Summary
                  </h2>
                  <dl className="mt-3 divide-y divide-border/70 text-sm">
                    {highlights.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-baseline justify-between gap-4 py-2.5 first:pt-1 last:pb-0"
                      >
                        <dt className="text-xs text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd className="text-right text-xs font-medium tabular-nums text-foreground">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {callout ? (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
                    {callout.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {callout.body}
                  </p>
                </div>
              ) : null}

              {sections && sections.length > 0 ? (
                <nav
                  aria-label="On this page"
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h2 className="text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase">
                    On this page
                  </h2>
                  <ul className="mt-3 space-y-2 text-xs">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="block py-0.5 font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                        >
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </aside>
        ) : null}

        <div
          className={
            hasRail
              ? "max-w-[65ch] space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-[15px] lg:col-span-8"
              : "max-w-[65ch] space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
          }
        >
          {children}

          <div className="mt-10 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
              <Button
                asChild
                variant="outline"
                className="min-h-10 w-full bg-background sm:w-auto"
              >
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
