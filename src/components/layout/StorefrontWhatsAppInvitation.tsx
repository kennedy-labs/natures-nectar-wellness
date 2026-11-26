import { ArrowUpRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  createTopicInquiryMessage,
  DEFAULT_STOREFRONT_WHATSAPP_MESSAGE,
} from "@/features/whatsapp/utils/whatsapp.utils";

const GUIDANCE_PROMPTS = [
  {
    id: "guidance-routine",
    title: "Which tea, honey, or supplement fits my routine?",
    hint: "Share what you're looking to support and get honest guidance",
    message: createTopicInquiryMessage("choosing the right product for my routine"),
  },
  {
    id: "guidance-usage",
    title: "Can you share ingredients or how to prepare it?",
    hint: "Simple usage notes, steep times, and pairing ideas",
    message: createTopicInquiryMessage("ingredients and preparation"),
  },
  {
    id: "guidance-delivery",
    title: "How do Nairobi delivery and pickup work?",
    hint: "Pickup timing, Nairobi drop-off, or countrywide courier",
    message: createTopicInquiryMessage("Nairobi delivery and pickup"),
  },
] as const;

export function StorefrontWhatsAppInvitation() {
  const directWhatsappUrl = getWhatsAppUrl(DEFAULT_STOREFRONT_WHATSAPP_MESSAGE);

  if (!directWhatsappUrl) {
    return null;
  }

  return (
    <section
      aria-labelledby="apothecary-guidance-heading"
      className="rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(24,42,32,0.04)] sm:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="space-y-4 lg:col-span-6">
          <p className="text-sm font-medium text-primary">
            Personal Botanical Guidance
          </p>
          <h2
            id="apothecary-guidance-heading"
            className="font-display text-2xl font-medium tracking-tight text-foreground text-balance sm:text-3xl"
          >
            Have a question before you order?
          </h2>
          <p className="max-w-[54ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            Choosing herbal blends or supplements shouldn&apos;t feel like
            guesswork. Message us directly on WhatsApp for genuine advice,
            ingredient clarity, or quick help arranging Nairobi delivery.
          </p>
          <div className="pt-1">
            <Button
              asChild
              size="lg"
              className="min-h-11 w-full gap-2 whitespace-nowrap sm:w-auto"
            >
              <a
                href={directWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Ask us on WhatsApp</span>
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              </a>
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border/80 border-t border-border/80 pt-2 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {GUIDANCE_PROMPTS.map((prompt) => {
            const promptUrl = getWhatsAppUrl(prompt.message);
            if (!promptUrl) return null;

            return (
              <a
                key={prompt.id}
                href={promptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-12 items-center justify-between gap-4 py-3.5 transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {prompt.hint}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-primary">
                  Ask
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
