"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";

import { useWhatsAppContext } from "@/components/layout/WhatsAppContext";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  createTopicInquiryMessage,
  DEFAULT_STOREFRONT_WHATSAPP_MESSAGE,
} from "@/features/whatsapp/utils/whatsapp.utils";

const WHISPER_DISMISSED_KEY = "nnw_wa_whisper_dismissed";
const WHISPER_DWELL_MS = 10_000;

const CONCIERGE_TOPICS = [
  {
    id: "choose-product",
    label: "Help me choose a product",
    description: "Recommendations for teas, raw honey, or supplements",
    message: createTopicInquiryMessage("choosing the right product for my routine"),
  },
  {
    id: "ingredients-usage",
    label: "Ask about ingredients & usage",
    description: "Preparation tips, dosage, and daily pairings",
    message: createTopicInquiryMessage("ingredients and daily usage"),
  },
  {
    id: "delivery-pickup",
    label: "Delivery & Nairobi pickup",
    description: "Free pickup, Nairobi drop-off, or countrywide dispatch",
    message: createTopicInquiryMessage("Nairobi delivery and pickup"),
  },
] as const;

export function FloatingWhatsAppButton() {
  const { contextMessage } = useWhatsAppContext();
  const trimmedContext = contextMessage?.trim() || "";
  const activeMessage = trimmedContext || DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  const directWhatsappUrl = getWhatsAppUrl(activeMessage);

  const [isOpen, setIsOpen] = useState(false);
  const [whisperVisible, setWhisperVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!directWhatsappUrl) return;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(WHISPER_DISMISSED_KEY) === "1";
    } catch {
      dismissed = false;
    }

    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setWhisperVisible(true);
    }, WHISPER_DWELL_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [directWhatsappUrl]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  if (!directWhatsappUrl) {
    return null;
  }

  function markWhisperSeen() {
    setWhisperVisible(false);
    try {
      sessionStorage.setItem(WHISPER_DISMISSED_KEY, "1");
    } catch {
      // Ignore storage access errors in private browsing modes
    }
  }

  function handleToggleOpen() {
    markWhisperSeen();
    setIsOpen((prev) => !prev);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const hasCustomContext =
    Boolean(trimmedContext) &&
    trimmedContext !== DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
    >
      {isOpen ? (
        <div
          id="whatsapp-concierge-card"
          role="dialog"
          aria-label="Ask Nature's Nectar Wellness on WhatsApp"
          className="w-[calc(100vw-2rem)] max-w-sm origin-bottom-right rounded-xl border border-border/80 bg-card text-card-foreground shadow-[0_14px_38px_-14px_rgba(24,42,32,0.22)] transition-all duration-150 ease-out"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3.5">
            <div className="space-y-0.5">
              <p className="font-display text-base font-medium text-foreground">
                Nature&apos;s Nectar Wellness
              </p>
              <p className="text-xs text-muted-foreground">
                Ask anything before you order — direct WhatsApp chat
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close WhatsApp menu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-border/70 px-2 py-1.5">
            {hasCustomContext ? (
              <a
                href={directWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="group flex min-h-11 items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-primary">
                    Ask about what you&apos;re viewing
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    &ldquo;{trimmedContext}&rdquo;
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : null}

            {CONCIERGE_TOPICS.map((topic) => {
              const topicUrl = getWhatsAppUrl(topic.message);
              if (!topicUrl) return null;

              return (
                <a
                  key={topic.id}
                  href={topicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="group flex min-h-11 items-center justify-between gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {topic.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topic.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </a>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/80 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              Opens WhatsApp in a new tab
            </span>
            <a
              href={directWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Start general chat
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : null}

      {!isOpen && whisperVisible ? (
        <div
          role="status"
          className="flex max-w-[17.5rem] items-center gap-1.5 rounded-xl border border-border/80 bg-card py-1.5 pl-3 pr-1.5 text-card-foreground shadow-[0_10px_28px_-10px_rgba(24,42,32,0.18)] transition-all duration-150 ease-out sm:max-w-xs"
        >
          <button
            type="button"
            onClick={handleToggleOpen}
            className="text-left text-xs leading-snug text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Unsure where to start? Ask us anything on WhatsApp.
          </button>
          <button
            type="button"
            onClick={markWhisperSeen}
            aria-label="Dismiss WhatsApp greeting"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-controls="whatsapp-concierge-card"
        aria-label={
          isOpen ? "Close WhatsApp concierge" : "Ask us anything on WhatsApp"
        }
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_10px_28px_-6px_rgba(24,42,32,0.38)] transition-transform duration-150 ease-out hover:scale-[1.03] hover:bg-primary/95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {isOpen ? (
          <X className="h-4 w-4 shrink-0" />
        ) : (
          <MessageCircle className="h-4 w-4 shrink-0" />
        )}
        <span>WhatsApp</span>
      </button>
    </div>
  );
}
