import { ArrowUpRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  createTopicInquiryMessage,
  DEFAULT_STOREFRONT_WHATSAPP_MESSAGE,
} from "@/features/whatsapp/utils/whatsapp.utils";

const OPTIONAL_TOPICS = [
  {
    id: "guidance-routine",
    label: "Choosing a product",
    message: createTopicInquiryMessage("choosing the right product"),
  },
  {
    id: "guidance-usage",
    label: "Ingredients & usage",
    message: createTopicInquiryMessage("ingredients and usage"),
  },
  {
    id: "guidance-delivery",
    label: "Nairobi pickup & delivery",
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
      className="border-t border-border/80 pt-10 text-center sm:pt-12"
    >
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-xs font-medium tracking-wide text-primary">
          Personal Botanical Guidance
        </p>
        <h2
          id="apothecary-guidance-heading"
          className="font-display text-2xl font-medium tracking-tight text-foreground text-balance sm:text-3xl"
        >
          Have a question before you order?
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Message us directly on WhatsApp for gentle product advice, usage
          notes, or Nairobi delivery help.
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
              <span>Chat on WhatsApp</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 pt-1 text-xs text-muted-foreground">
          <span>Quick topics:</span>
          {OPTIONAL_TOPICS.map((topic, index) => {
            const topicUrl = getWhatsAppUrl(topic.message);
            if (!topicUrl) return null;

            return (
              <span key={topic.id} className="inline-flex items-center gap-2.5">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                <a
                  href={topicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 transition-colors hover:underline"
                >
                  {topic.label}
                </a>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
