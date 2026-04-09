import axios from "axios";

const LS_KEY = "pos_auth_user";

/**
 * Pre-configured Axios instance for all backend API calls.
 *
 * Base URL  : Empty string in development so every request is relative
 *             (e.g. "/api/products") and routed through the Vite dev-server
 *             proxy to http://localhost:8080.  In production builds override
 *             with VITE_API_URL (e.g. https://api.yourdomain.com).
 *
 * Interceptor: Reads the JWT token from localStorage and appends
 *              Authorization: Bearer <token> to every outgoing request.
 *              If no token is present the header is omitted (public routes
 *              like /api/auth/login work without it).
 */
const api = axios.create({
  // Vite exposes VITE_* variables via import.meta.env.
  // In local dev, keep this empty so calls stay relative (e.g. /api/products)
  // and are forwarded by vite.config.ts proxy to localhost:8080.
  // Optional override for direct backend calls: VITE_API_URL or VITE_BACKEND_URL.
  baseURL: import.meta.env.VITE_API_URL ?? import.meta.env.VITE_BACKEND_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach Bearer token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { token } = JSON.parse(raw) as { token?: string };
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // localStorage unavailable or JSON corrupt — continue without header
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — handle 401 globally ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 (expired/invalid token), wipe the session
    // and redirect to login so the user is never silently stuck.
    if (error.response?.status === 401) {
      // Dispatch a custom event so AuthContext can do a clean React-state
      // logout (clear localStorage + setUser(null) + navigate) without
      // axiosInstance needing to import or depend on React Router.
      window.dispatchEvent(new CustomEvent("pos:session-expired"));
    }
    return Promise.reject(error);
  },
);

export default api;
