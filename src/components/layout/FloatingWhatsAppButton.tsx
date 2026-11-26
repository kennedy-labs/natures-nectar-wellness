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

const OPTIONAL_TOPICS = [
  {
    id: "choose-product",
    label: "Help choosing a product",
    message: createTopicInquiryMessage("choosing the right product"),
  },
  {
    id: "ingredients-usage",
    label: "Ingredients & usage",
    message: createTopicInquiryMessage("ingredients and usage"),
  },
  {
    id: "delivery-pickup",
    label: "Nairobi pickup & delivery",
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

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
    >
      {isOpen ? (
        <div
          id="whatsapp-concierge-card"
          role="dialog"
          aria-label="Chat on WhatsApp"
          className="w-[calc(100vw-2rem)] max-w-[20rem] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-[0_12px_32px_-12px_rgba(24,42,32,0.22)] transition-all duration-150 ease-out"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="font-display text-base font-medium text-foreground">
                Nature&apos;s Nectar Wellness
              </p>
              <p className="text-xs text-muted-foreground">
                Ask anything directly on WhatsApp
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close WhatsApp card"
              className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            &ldquo;{activeMessage}&rdquo;
          </p>

          <a
            href={directWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            <span>Continue to WhatsApp</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </a>

          <div className="mt-3.5 border-t border-border/70 pt-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Optional quick topics
            </p>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {OPTIONAL_TOPICS.map((topic) => {
                const topicUrl = getWhatsAppUrl(topic.message);
                if (!topicUrl) return null;

                return (
                  <a
                    key={topic.id}
                    href={topicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClose}
                    className="inline-flex min-h-7 items-center text-xs text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {topic.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {!isOpen && whisperVisible ? (
        <div
          role="status"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card py-1.5 pl-3 pr-1.5 text-card-foreground shadow-[0_8px_22px_-8px_rgba(24,42,32,0.16)] transition-all duration-150 ease-out"
        >
          <button
            type="button"
            onClick={handleToggleOpen}
            className="text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Questions? Ask us on WhatsApp
          </button>
          <button
            type="button"
            onClick={markWhisperSeen}
            aria-label="Dismiss message"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        aria-label={isOpen ? "Close WhatsApp" : "Chat on WhatsApp"}
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-6px_rgba(24,42,32,0.34)] transition-transform duration-150 ease-out hover:scale-[1.02] hover:bg-primary/95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
