import axios from "axios";

const LS_KEY = "pos_auth_user";

/**
 * Pre-configured Axios instance for all backend API calls.
 *
 * Base URL  : http://localhost:8080
 * Interceptor: Reads the JWT token from localStorage and appends
 *              Authorization: Bearer <token> to every outgoing request.
 *              If no token is present the header is omitted (public routes
 *              like /api/auth/login work without it).
 */
const api = axios.create({
  baseURL: "http://localhost:8080",
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
      localStorage.removeItem(LS_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
