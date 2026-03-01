import { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   SuccessPopup — slide-in toast notification
   Props:
     show     : boolean
     type     : "success" | "error" | "warning"
     message  : string
     onClose  : () => void
     duration : number (ms, default 3500)
   ───────────────────────────────────────────────────────────────────────── */

const CONFIG = {
  success: {
    icon:       CheckCircle2,
    iconClass:  "text-emerald-500",
    barClass:   "bg-emerald-500",
    wrapClass:  "border-emerald-200 bg-white dark:border-emerald-800 dark:bg-zinc-900",
    label:      "Success",
    labelClass: "text-emerald-700 dark:text-emerald-400",
  },
  error: {
    icon:       AlertCircle,
    iconClass:  "text-red-500",
    barClass:   "bg-red-500",
    wrapClass:  "border-red-200 bg-white dark:border-red-800 dark:bg-zinc-900",
    label:      "Error",
    labelClass: "text-red-700 dark:text-red-400",
  },
  warning: {
    icon:       AlertTriangle,
    iconClass:  "text-amber-500",
    barClass:   "bg-amber-500",
    wrapClass:  "border-amber-200 bg-white dark:border-amber-800 dark:bg-zinc-900",
    label:      "Warning",
    labelClass: "text-amber-700 dark:text-amber-400",
  },
};

export default function SuccessPopup({ show, type = "success", message, onClose, duration = 3500 }) {
  const timerRef = useRef(null);

  /* Auto-dismiss */
  useEffect(() => {
    if (!show) return;
    timerRef.current = setTimeout(onClose, duration);
    return () => clearTimeout(timerRef.current);
  }, [show, duration, onClose]);

  const cfg = CONFIG[type] ?? CONFIG.success;
  const Icon = cfg.icon;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-[100] w-80 pointer-events-none",
        "transition-all duration-300 ease-out",
        show
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-2xl",
          cfg.wrapClass
        )}
      >
        {/* Body */}
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Icon className={cn("h-5 w-5 mt-px shrink-0", cfg.iconClass)} />
          <div className="flex-1 min-w-0">
            <p className={cn("text-[11px] font-bold uppercase tracking-wider", cfg.labelClass)}>
              {cfg.label}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground leading-snug">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar — shrinks over `duration` ms */}
        <div className="h-0.5 w-full bg-muted/40">
          <div
            className={cn("h-full origin-left", cfg.barClass)}
            style={{
              animation: show ? `shrink-progress ${duration}ms linear forwards` : "none",
            }}
          />
        </div>
      </div>

      {/* Keyframe injected inline so no tailwind plugin needed */}
      <style>{`
        @keyframes shrink-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
