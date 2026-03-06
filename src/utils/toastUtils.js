/**
 * toastUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised react-toastify helpers.
 * Import these instead of calling `toast` directly so every CRUD module
 * shares the same notification style and options.
 *
 * Usage:
 *   import { showSuccess, showError, showInfo, showWarning } from "@/utils/toastUtils";
 *
 *   showSuccess("Product saved successfully!");
 *   showError("Failed to delete supplier.");
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { toast } from "react-toastify";

// ── Shared defaults ───────────────────────────────────────────────────────────
const BASE_OPTIONS = {
  position:        "top-right",
  autoClose:       3000,
  hideProgressBar: false,
  closeOnClick:    true,
  pauseOnHover:    true,
  draggable:       true,
};

// ── Exported helpers ──────────────────────────────────────────────────────────

/** Green — use after a successful create / update / delete */
export const showSuccess = (message, options = {}) =>
  toast.success(message, { ...BASE_OPTIONS, ...options });

/** Red — use when an API call fails or validation is rejected */
export const showError = (message, options = {}) =>
  toast.error(message, { ...BASE_OPTIONS, autoClose: 5000, ...options });

/** Blue — use for neutral informational messages */
export const showInfo = (message, options = {}) =>
  toast.info(message, { ...BASE_OPTIONS, ...options });

/** Orange / yellow — use for non-blocking warnings */
export const showWarning = (message, options = {}) =>
  toast.warn(message, { ...BASE_OPTIONS, ...options });

/**
 * Async loader toast — shows a loading spinner while a promise resolves.
 *
 * Example:
 *   showPromise(
 *     api.delete(`/api/products/${id}`),
 *     { pending: "Deleting product…", success: "Product deleted!", error: "Delete failed." }
 *   );
 */
export const showPromise = (promise, messages, options = {}) =>
  toast.promise(promise, messages, { ...BASE_OPTIONS, ...options });
