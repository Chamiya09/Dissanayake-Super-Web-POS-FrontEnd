/**
 * SystemToast.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified notification toast component + global stack container.
 *
 * Exports:
 *   default  SystemToast  — individual toast item (used internally)
 *   named    ToastStack   — fixed-positioned container; render once in App.tsx
 *
 * Design tokens (per spec):
 *   Container  : bg-white, 4px left border, rounded-r-lg, shadow-lg shadow-slate-200/60
 *   Title      : text-slate-900 font-bold
 *   Message    : text-slate-500 font-medium
 *
 *   success → border/icon: Emerald-500 / Emerald-100 / Emerald-600
 *   error   → border/icon: Rose-500   / Rose-100   / Rose-600
 *   warning → border/icon: Amber-500  / Amber-100  / Amber-600
 *   info    → border/icon: Indigo-500 / Indigo-100 / Indigo-600
 *
 * Animation: CSS keyframes (.toast-enter / .toast-exit) defined in index.css.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { X, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

// ── Type configuration ───────────────────────────────────────────────────────

const TYPE_CONFIG = {
  success: {
    border:    "border-l-emerald-500",
    iconBg:    "bg-emerald-100",
    iconColor: "text-emerald-600",
    barColor:  "bg-emerald-500",
    Icon:      CheckCircle2,
  },
  error: {
    border:    "border-l-rose-500",
    iconBg:    "bg-rose-100",
    iconColor: "text-rose-600",
    barColor:  "bg-rose-500",
    Icon:      XCircle,
  },
  warning: {
    border:    "border-l-amber-500",
    iconBg:    "bg-amber-100",
    iconColor: "text-amber-600",
    barColor:  "bg-amber-500",
    Icon:      AlertTriangle,
  },
  info: {
    border:    "border-l-indigo-500",
    iconBg:    "bg-indigo-100",
    iconColor: "text-indigo-600",
    barColor:  "bg-indigo-500",
    Icon:      Info,
  },
};

// ── Individual Toast Item ────────────────────────────────────────────────────

function SystemToast({ notification, onDismiss }) {
  const { id, type, title, message, leaving } = notification;
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const { Icon } = cfg;

  return (
    <div
      className={[
        // Shape & surface
        "relative flex w-80 items-start gap-0 overflow-hidden",
        "border-l-4 bg-white rounded-r-lg",
        "shadow-lg shadow-slate-200/60",
        // Dynamic color
        cfg.border,
        // Slide animation
        leaving ? "toast-exit" : "toast-enter",
      ].join(" ")}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Progress bar — depletes over 4 s matching auto-dismiss */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] ${cfg.barColor} toast-progress`}
        style={{ animationDuration: "4s" }}
        aria-hidden="true"
      />

      {/* Icon badge */}
      <div
        className={`
          shrink-0 flex items-center justify-center
          h-8 w-8 rounded-xl mt-3.5 ml-3
          ${cfg.iconBg}
        `}
      >
        <Icon className={`h-[18px] w-[18px] ${cfg.iconColor}`} />
      </div>

      {/* Text content */}
      <div className="flex-1 py-3.5 pl-3 pr-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-900 leading-snug">
          {title}
        </p>
        {message && (
          <p className="mt-0.5 text-[12px] font-medium text-slate-500 leading-relaxed line-clamp-2">
            {message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(id)}
        className="
          shrink-0 mt-3 mr-2.5
          flex h-6 w-6 items-center justify-center rounded-lg
          text-slate-400 hover:bg-slate-100 hover:text-slate-600
          transition-colors focus:outline-none
        "
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Stack Container (render once in App.tsx) ─────────────────────────────────

export function ToastStack() {
  const { notifications, dismiss } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      aria-label="Notification area"
      aria-live="polite"
    >
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <SystemToast notification={n} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

export default SystemToast;
