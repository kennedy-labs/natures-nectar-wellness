"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";

import { type AdminOrder } from "@/features/admin/utils/order-display.utils";
import {
  getNextOrderAction,
  type OrderNextAction,
} from "@/features/orders/utils/order-workflow.utils";
import { cn } from "@/lib/utils";

type OrderActionsMenuProps = {
  order: AdminOrder;
  busy?: boolean;
  variant?: "default" | "overflow";
  onViewDetails: (order: AdminOrder) => void;
  onNextAction: (order: AdminOrder, action: OrderNextAction) => void;
  onCancel: (order: AdminOrder) => void;
  onDelete: (order: AdminOrder) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  openUpward: boolean;
};

const MENU_WIDTH = 224;
const ESTIMATED_MENU_HEIGHT = 188;

function NextActionIcon({
  action,
  deliveryMethod,
}: {
  action: OrderNextAction;
  deliveryMethod: string;
}) {
  if (action.kind === "open_quote") {
    return <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />;
  }
  if (action.kind === "open_payment") {
    return <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />;
  }
  if (action.targetStatus === "OUT_FOR_DELIVERY") {
    return deliveryMethod === "PICKUP" ? (
      <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    ) : (
      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
    );
  }
  return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />;
}

export function OrderActionsMenu({
  order,
  busy = false,
  variant = "default",
  onViewDetails,
  onNextAction,
  onCancel,
  onDelete,
}: OrderActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const nextAction = getNextOrderAction(order);
  const isOpenOrder = nextAction !== null;

  function computePosition() {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward =
      spaceBelow < ESTIMATED_MENU_HEIGHT + 12 &&
      rect.top > ESTIMATED_MENU_HEIGHT + 12;

    const top = openUpward ? rect.top - 6 : rect.bottom + 6;
    const left = Math.max(
      12,
      Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 12)
    );

    setPosition({ top, left, openUpward });
  }

  function toggleMenu() {
    if (busy) return;
    if (open) {
      setOpen(false);
      return;
    }
    computePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleViewportChange() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [open]);

  const isOverflow = variant === "overflow";

  return (
    <div
      className="inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          isOverflow
            ? `More options for order ${order.orderNumber}`
            : `Actions for order ${order.orderNumber}`
        }
        onClick={toggleMenu}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md border text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4E37]/30",
          isOverflow ? "w-9 px-0" : "min-w-[92px] gap-1.5 px-2.5",
          open
            ? "border-[#1F4E37]/40 bg-[#1F4E37]/10 text-[#1F4E37]"
            : "border-[#E3DFD6] bg-[#FCFBF8] text-[#14221B] hover:border-[#14221B]/25 hover:bg-[#F7F5F0]",
          busy && "cursor-not-allowed opacity-60"
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1F4E37]" />
        ) : isOverflow ? (
          <MoreHorizontal className="h-4 w-4 text-[#55635C]" />
        ) : (
          <>
            <span>Actions</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#55635C] transition-transform duration-150",
                open && "rotate-180 text-[#1F4E37]"
              )}
            />
          </>
        )}
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={`Order ${order.orderNumber} actions`}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: MENU_WIDTH,
                transform: position.openUpward ? "translateY(-100%)" : undefined,
              }}
              className="z-50 rounded-lg border border-[#E3DFD6] bg-[#FCFBF8] p-1.5 shadow-lg ring-1 ring-black/5"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onViewDetails(order);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium text-[#14221B] transition-colors hover:bg-[#F7F5F0]"
              >
                <Eye className="h-3.5 w-3.5 shrink-0 text-[#55635C]" />
                <span>View Details</span>
              </button>

              {!isOverflow && nextAction ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onNextAction(order, nextAction);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors",
                    nextAction.kind === "open_quote" ||
                      nextAction.kind === "open_payment"
                      ? "text-[#92400E] hover:bg-[#FFFBEB]"
                      : "text-[#1F4E37] hover:bg-[#1F4E37]/10"
                  )}
                >
                  <NextActionIcon
                    action={nextAction}
                    deliveryMethod={order.deliveryMethod}
                  />
                  <span className="min-w-0">
                    <span className="block">{nextAction.label}</span>
                    {nextAction.kind === "transition" &&
                    nextAction.autoVerifiesCash ? (
                      <span className="block text-[10px] font-normal text-[#55635C]">
                        Collects &amp; verifies cash
                      </span>
                    ) : null}
                  </span>
                </button>
              ) : null}

              {isOpenOrder ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onCancel(order);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium text-[#92400E] transition-colors hover:bg-[#FFFBEB]"
                >
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Cancel order</span>
                </button>
              ) : null}

              <div className="my-1 border-t border-[#E3DFD6]" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onDelete(order);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium text-[#991B1B] transition-colors hover:bg-[#FEF2F2]"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Delete order</span>
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
