"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";

import { InlineBotanicalSearch } from "@/components/layout/InlineBotanicalSearch";
import { Button } from "@/components/ui/button";

export function HeaderSearchTrigger() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!open) return;
      const target = event.target as Node | null;
      if (
        target &&
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="header-search-overlay"
        aria-label={open ? "Close catalog search" : "Search formulations"}
        className="h-9 shrink-0 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground sm:px-2.5 sm:text-sm"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden lg:inline">Search</span>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="header-search-overlay"
            ref={panelRef}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-40 border-b border-border bg-card/98 px-4 py-3 shadow-[0_12px_28px_-14px_rgba(20,34,27,0.14)] backdrop-blur-md sm:px-6"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2">
              <InlineBotanicalSearch
                variant="subbar"
                placeholder="Search raw honey, shilajit, hibiscus tea..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Dismiss search bar"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
