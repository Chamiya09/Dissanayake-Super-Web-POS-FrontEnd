/**
 * NotificationContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global notification (toast) system for Dissanayake Super POS.
 *
 * Usage in any component:
 *   import { useNotification } from "@/context/NotificationContext";
 *
 *   const { notify } = useNotification();
 *
 *   notify({ type: "success", title: "Order Placed", message: "Redirecting..." });
 *   notify({ type: "error",   title: "Request Failed", message: "Could not cancel order." });
 *   notify({ type: "warning", title: "Low Stock",     message: "3 items below threshold." });
 *   notify({ type: "info",    title: "Connecting...", message: "Sending email to supplier." });
 *
 * Types: "success" | "error" | "warning" | "info"
 * Auto-dismiss: 4 seconds (handled internally — no manual cleanup needed).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useCallback, useRef } from "react";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timers           = useRef({});
  // EXIT_DURATION must match .toast-exit animation duration in index.css (280ms)
  const EXIT_DURATION    = 280;
  const AUTO_DISMISS_MS  = 4000;

  /** Trigger exit animation then remove the notification from the list. */
  const dismiss = useCallback((id) => {
    // Prevent double-dismiss (e.g. manual close + timer firing together)
    if (!timers.current[id] && !timers.current[`_exit_${id}`]) return;

    clearTimeout(timers.current[id]);
    delete timers.current[id];

    // Mark leaving → triggers CSS exit animation
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n))
    );

    // Remove from DOM after animation completes
    timers.current[`_exit_${id}`] = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      delete timers.current[`_exit_${id}`];
    }, EXIT_DURATION);
  }, []);

  /**
   * Show a new notification.
   * @param {{ type?: "success"|"error"|"warning"|"info", title: string, message?: string }} opts
   * @returns {string} id — can be used to manually dismiss early
   */
  const notify = useCallback(
    ({ type = "info", title, message = "" }) => {
      const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setNotifications((prev) => [
        ...prev,
        { id, type, title, message, leaving: false },
      ]);

      // Schedule auto-dismiss
      timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);

      return id;
    },
    [dismiss]
  );

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access the notification system from any component.
 * Must be used inside <NotificationProvider>.
 */
export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used inside <NotificationProvider>.");
  }
  return ctx;
}
