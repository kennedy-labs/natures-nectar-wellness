"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, MessageCircle, X } from "lucide-react";

import { useWhatsAppContext } from "@/components/layout/WhatsAppContext";
import { Textarea } from "@/components/ui/textarea";
import { getWhatsAppUrl } from "@/config/env.client";
import {
  createTopicInquiryMessage,
  DEFAULT_STOREFRONT_WHATSAPP_MESSAGE,
} from "@/features/whatsapp/utils/whatsapp.utils";
import { cn } from "@/lib/utils";

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
  const { contextMessage, mobileBottomBarVisible } = useWhatsAppContext();
  const trimmedContext = contextMessage?.trim() || "";
  const activeMessage = trimmedContext || DEFAULT_STOREFRONT_WHATSAPP_MESSAGE;
  const directWhatsappUrl = getWhatsAppUrl(activeMessage);
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [whisperVisible, setWhisperVisible] = useState(false);
  const [draftState, setDraftState] = useState<{ base: string; text: string }>({
    base: activeMessage,
    text: activeMessage,
  });

  const draftMessage =
    draftState.base === activeMessage ? draftState.text : activeMessage;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      // Ignore storage access errors
    }
  }

  function handleToggleOpen() {
    markWhisperSeen();
    setIsOpen((prev) => !prev);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleSelectTopic(message: string) {
    setDraftState({ base: activeMessage, text: message });
    textareaRef.current?.focus();
  }

  const finalMessage = draftMessage.trim() || activeMessage;
  const submitWhatsappUrl = getWhatsAppUrl(finalMessage) ?? directWhatsappUrl;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed right-4 z-40 flex flex-col items-end gap-2 transition-[bottom] duration-200 ease-out sm:right-6 md:bottom-6",
        mobileBottomBarVisible
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6"
      )}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="whatsapp-concierge-card"
            role="dialog"
            aria-label="Chat on WhatsApp"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-[calc(100vw-2rem)] max-w-[20rem] rounded-xl border border-border bg-card p-4 text-card-foreground shadow-[0_14px_34px_-12px_rgba(20,34,27,0.22)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-display text-base font-medium text-foreground">
                  Nature&apos;s Nectar Concierge
                </p>
                <p className="text-xs text-muted-foreground">
                  Direct botanical help on WhatsApp
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

            <div className="mt-3 space-y-1.5">
              <label htmlFor="whatsapp-draft-message" className="sr-only">
                Your WhatsApp message
              </label>
              <Textarea
                ref={textareaRef}
                id="whatsapp-draft-message"
                rows={3}
                value={draftMessage}
                onChange={(event) =>
                  setDraftState({ base: activeMessage, text: event.target.value })
                }
                placeholder={activeMessage}
                className="min-h-[4.75rem] resize-none bg-background text-base leading-relaxed md:text-sm"
              />
            </div>

            <a
              href={submitWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>Continue to WhatsApp</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </a>

            <div className="mt-3.5 border-t border-border pt-3">
              <p className="text-[11px] font-medium text-muted-foreground">
                Quick topics
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {OPTIONAL_TOPICS.map((topic) => {
                  const isSelected = draftMessage.trim() === topic.message;

                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(topic.message)}
                      className={cn(
                        "inline-flex min-h-7 items-center text-left text-xs underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "font-medium text-foreground underline"
                          : "text-primary"
                      )}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && whisperVisible ? (
          <motion.div
            role="status"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card py-1.5 pl-3 pr-1.5 text-card-foreground shadow-[0_8px_22px_-8px_rgba(20,34,27,0.16)]"
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
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={isOpen}
        aria-controls="whatsapp-concierge-card"
        aria-label={isOpen ? "Close WhatsApp" : "Chat on WhatsApp"}
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/20 bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_10px_24px_-6px_rgba(20,34,27,0.32)] transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-primary/95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
