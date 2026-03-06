/**
 * PaymentMethodModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Keyboard-accessible full-screen modal for choosing Cash or Card.
 *
 * Keyboard controls:
 *   ←  /  ↑     → highlight CASH
 *   →  /  ↓     → highlight CARD
 *   Enter        → confirm highlighted option
 *   Escape       → close without selecting
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from "react";
import { Banknote, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethodOption = "Cash" | "Card";

interface PaymentMethodModalProps {
  open: boolean;
  onConfirm: (method: PaymentMethodOption) => void;
  onClose: () => void;
}

export function PaymentMethodModal({ open, onConfirm, onClose }: PaymentMethodModalProps) {
  const [selected, setSelected] = useState<PaymentMethodOption>("Cash");

  /* Reset to Cash each time the modal opens */
  useEffect(() => {
    if (open) setSelected("Cash");
  }, [open]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      // Don't interfere with other inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setSelected("Cash");
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setSelected("Card");
          break;
        case "Enter":
          e.preventDefault();
          onConfirm(selected);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, selected, onConfirm, onClose]);

  if (!open) return null;

  return (
    /* ── Backdrop ── */
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">

      {/* ── Modal card ── */}
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-[18px] font-black text-foreground leading-tight">
              Select Payment Method
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Use&nbsp;
              <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1 py-px font-mono text-[10px]">←</kbd>
              &nbsp;
              <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1 py-px font-mono text-[10px]">→</kbd>
              &nbsp;to switch, then&nbsp;
              <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1 py-px font-mono text-[10px]">Enter</kbd>
              &nbsp;to confirm
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Payment option cards */}
        <div className="grid grid-cols-2 gap-4 p-6">

          {/* ── CASH ── */}
          <button
            type="button"
            onClick={() => onConfirm("Cash")}
            onMouseEnter={() => setSelected("Cash")}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 py-8 px-4 transition-all duration-150 focus:outline-none select-none",
              selected === "Cash"
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-lg shadow-emerald-500/25 scale-[1.04]"
                : "border-border bg-secondary/30 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
            )}
          >
            {/* Icon circle */}
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-150",
              selected === "Cash"
                ? "bg-emerald-500 shadow-lg shadow-emerald-500/40"
                : "bg-secondary text-muted-foreground"
            )}>
              <Banknote className={cn(
                "h-8 w-8 transition-colors",
                selected === "Cash" ? "text-white" : ""
              )} />
            </div>

            {/* Label */}
            <span className={cn(
              "text-[16px] font-black tracking-widest uppercase transition-colors",
              selected === "Cash" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
            )}>
              CASH
            </span>

            {/* Active check */}
            <div className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full transition-all",
              selected === "Cash" ? "bg-emerald-500 scale-100 opacity-100" : "scale-75 opacity-0"
            )}>
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>

          {/* ── CARD ── */}
          <button
            type="button"
            onClick={() => onConfirm("Card")}
            onMouseEnter={() => setSelected("Card")}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 py-8 px-4 transition-all duration-150 focus:outline-none select-none",
              selected === "Card"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/25 scale-[1.04]"
                : "border-border bg-secondary/30 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
            )}
          >
            {/* Icon circle */}
            <div className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-150",
              selected === "Card"
                ? "bg-blue-500 shadow-lg shadow-blue-500/40"
                : "bg-secondary text-muted-foreground"
            )}>
              <CreditCard className={cn(
                "h-8 w-8 transition-colors",
                selected === "Card" ? "text-white" : ""
              )} />
            </div>

            {/* Label */}
            <span className={cn(
              "text-[16px] font-black tracking-widest uppercase transition-colors",
              selected === "Card" ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"
            )}>
              CARD
            </span>

            {/* Active check */}
            <div className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full transition-all",
              selected === "Card" ? "bg-blue-500 scale-100 opacity-100" : "scale-75 opacity-0"
            )}>
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer keyboard hint */}
        <div className="flex items-center justify-center gap-5 border-t border-border bg-secondary/20 px-6 py-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">←</kbd>
            <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">→</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
            <span>confirm</span>
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <kbd className="inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
            <span>cancel</span>
          </span>
        </div>
      </div>
    </div>
  );
}
