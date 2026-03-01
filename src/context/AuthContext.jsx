import { createContext, useContext, useState, useCallback } from "react";
import api from "@/lib/axiosInstance";

const LS_KEY = "pos_auth_user";

/**
 * Default home page per role — used by login redirect and role-gate redirects.
 * Staff land on POS Checkout (/), Owner/Manager on the Dashboard.
 */
export const ROLE_HOME = {
  Owner:   "/dashboard",
  Manager: "/dashboard",
  Staff:   "/staff-dashboard",
};

function loadUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Context
   ───────────────────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  /**
   * login(username, password) — async, calls POST /api/auth/login.
   * Returns { success: true, user } | { success: false, error: string }
   *
   * Stored user shape: { token, username, name, role }
   *   token    — JWT for API calls (auto-attached by axiosInstance interceptor)
   *   username — login username   (used for API calls like change-password)
   *   name     — full display name (shown in UI, AppHeader, profile cards)
   *   role     — Owner | Manager | Staff
   */
  const login = useCallback(async (username, password) => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: "Username and password are required." };
    }

    try {
      const { data } = await api.post("/api/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      // data = { token, username, name, role }
      const sessionUser = {
        token:    data.token,
        username: data.username,
        name:     data.name,
        role:     data.role,
      };

      localStorage.setItem(LS_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true, user: sessionUser };

    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        return { success: false, error: "Invalid username or password." };
      }
      if (status === 403) {
        return { success: false, error: "Your account has been deactivated. Please contact your manager." };
      }
      return { success: false, error: "Unable to connect to the server. Please try again." };
    }
  }, []);

  /** logout — clears storage and resets state */
  const logout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
