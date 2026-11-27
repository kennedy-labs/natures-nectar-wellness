"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export type FaqTopic =
  | "M-Pesa & Payments"
  | "Delivery"
  | "Returns & Safety";

export type FaqItem = {
  question: string;
  answer: string;
  topic: FaqTopic;
};

type FaqAccordionProps = {
  items: readonly FaqItem[];
};

const TOPICS: Array<"All" | FaqTopic> = [
  "All",
  "M-Pesa & Payments",
  "Delivery",
  "Returns & Safety",
];

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [selectedTopic, setSelectedTopic] = useState<"All" | FaqTopic>("All");
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    items[0]?.question ?? null
  );
  const prefersReducedMotion = useReducedMotion();

  const visibleItems = useMemo(() => {
    if (selectedTopic === "All") return items;
    return items.filter((item) => item.topic === selectedTopic);
  }, [items, selectedTopic]);

  function handleSelectTopic(topic: "All" | FaqTopic) {
    setSelectedTopic(topic);
    const nextList =
      topic === "All" ? items : items.filter((item) => item.topic === topic);
    if (
      nextList.length > 0 &&
      !nextList.some((item) => item.question === openQuestion)
    ) {
      setOpenQuestion(nextList[0].question);
    }
  }

  return (
    <div className="space-y-6">
      {/* Topic Filter Bar (Segmented Underline, zero pills) */}
      <div
        role="tablist"
        aria-label="Filter questions by topic"
        className="flex gap-1 overflow-x-auto border-b border-border pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TOPICS.map((topic) => {
          const isActive = selectedTopic === topic;
          return (
            <button
              key={topic}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTopic(topic)}
              className={cn(
                "relative min-h-10 shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm",
                isActive
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Hairline Accordion Rows */}
      <div className="divide-y divide-border border-b border-border">
        {visibleItems.map((item, index) => {
          const isOpen = openQuestion === item.question;
          const numberLabel = String(index + 1).padStart(2, "0");
          const panelId = `faq-panel-${index}`;
          const triggerId = `faq-trigger-${index}`;

          return (
            <div key={item.question} className="py-1">
              <h2>
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenQuestion((prev) =>
                      prev === item.question ? null : item.question
                    )
                  }
                  className="flex w-full items-start justify-between gap-4 py-4 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:py-5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-primary tabular-nums">
                        {numberLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.topic}</span>
                    </div>
                    <span className="block font-display text-lg font-medium leading-snug text-foreground sm:text-xl">
                      {item.question}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors"
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-primary" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </span>
                </button>
              </h2>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { height: 0, opacity: 0 }
                    }
                    animate={{ height: "auto", opacity: 1 }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { height: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[65ch] pb-5 pr-10 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
