import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosInstance";

export const LS_KEY = "pos_auth_user";

/**
 * Default home page per role — used by login redirect and role-gate redirects.
 * Staff land on POS Checkout, Owner/Manager on the Dashboard.
 */
export const ROLE_HOME = {
  Owner:   "/dashboard",
  Manager: "/dashboard",
  Staff:   "/staff-dashboard",
};

/**
 * Decode a JWT payload (base64url) to read the `exp` claim.
 * Does NOT verify the signature — only used for client-side expiry checks.
 */
function jwtExpiry(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp ?? null; // Unix seconds
  } catch {
    return null;
  }
}

/**
 * Returns the stored user if the JWT is still valid, null otherwise.
 * Wipes localStorage automatically when a token is found to have expired,
 * guaranteeing the user is never silently left in an expired session after
 * a page refresh.
 */
function loadUser() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const exp = jwtExpiry(parsed.token);
    if (exp !== null && exp * 1000 < Date.now()) {
      localStorage.removeItem(LS_KEY); // expired — wipe immediately
      return null;
    }
    return parsed;
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
  const navigate = useNavigate();

  /**
   * logout — clears storage, resets React state, and redirects to /login.
   * Called by:
   *   • Navbar "Sign Out" button (AppHeader)
   *   • The pos:session-expired event (fired by axiosInstance on any 401)
   *   • Settings page after account deactivation
   */
  const logout = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  /**
   * Listen for session-expired events dispatched by the Axios 401 interceptor.
   * Keeps axiosInstance decoupled from React Router while ensuring a clean
   * React-state logout any time the backend rejects a token.
   */
  useEffect(() => {
    const handleExpiry = () => logout();
    window.addEventListener("pos:session-expired", handleExpiry);
    return () => window.removeEventListener("pos:session-expired", handleExpiry);
  }, [logout]);

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
