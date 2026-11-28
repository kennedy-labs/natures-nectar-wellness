"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminToastTone = "success" | "error" | "info";

export type AdminToastInput = {
  tone?: AdminToastTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type AdminToastItem = AdminToastInput & {
  id: string;
  tone: AdminToastTone;
};

export function useAdminToastQueue() {
  const [toasts, setToasts] = useState<AdminToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (input: AdminToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const tone: AdminToastTone = input.tone ?? "success";
      const durationMs = input.durationMs ?? (tone === "error" ? 5500 : 4200);

      setToasts((prev) => {
        const next = [...prev, { ...input, id, tone }];
        return next.slice(-3);
      });

      const timer = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, durationMs);

      timersRef.current.set(id, timer);
    },
    []
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return {
    toasts,
    pushToast,
    dismissToast,
  };
}

export function AdminToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: AdminToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Action notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const isError = toast.tone === "error";
          const isSuccess = toast.tone === "success";

          return (
            <motion.div
              key={toast.id}
              role={isError ? "alert" : "status"}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
                isError
                  ? "border-[#DC2626]/30 bg-[#FEF2F2] text-[#991B1B]"
                  : isSuccess
                    ? "border-[#1F4E37]/30 bg-[#FCFBF8] text-[#14221B]"
                    : "border-[#E3DFD6] bg-[#FCFBF8] text-[#14221B]"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-[#B91C1C]" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-4 w-4 text-[#1F4E37]" />
                ) : (
                  <Info className="h-4 w-4 text-[#1F4E37]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-snug">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p
                    className={cn(
                      "mt-0.5 text-xs leading-relaxed",
                      isError ? "text-[#991B1B]/85" : "text-[#55635C]"
                    )}
                  >
                    {toast.description}
                  </p>
                ) : null}
                {toast.actionLabel && toast.onAction ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.onAction?.();
                      onDismiss(toast.id);
                    }}
                    className="mt-1.5 text-xs font-semibold text-[#1F4E37] underline-offset-4 hover:underline"
                  >
                    {toast.actionLabel}
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#55635C] transition-colors hover:bg-black/5 hover:text-[#14221B]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
