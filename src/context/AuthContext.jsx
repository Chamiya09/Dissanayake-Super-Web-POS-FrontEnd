import { createContext, useContext, useState, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   Simulated user database
   username → { name, role }  (password is accepted as any non-empty string)
   ───────────────────────────────────────────────────────────────────────── */
const MOCK_USERS = {
  admin:    { name: "Nuwan Dissanayake", username: "admin",    role: "Owner"   },
  manager1: { name: "Kamala Perera",     username: "manager1", role: "Manager" },
  staff1:   { name: "Sachini Fernando",  username: "staff1",   role: "Staff"   },
};

const LS_KEY = "pos_auth_user";

/**
 * Default home page per role — used by login redirect and role-gate redirects.
 * Staff land on POS Checkout (/), Owner/Manager on the Dashboard.
 */
export const ROLE_HOME = {
  Owner:   "/dashboard",
  Manager: "/dashboard",
  Staff:   "/",
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
   * login(username, password) → { success: true, user } | { success: false, error }
   * Password can be anything non-empty (simulated).
   */
  const login = useCallback((username, password) => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: "Username and password are required." };
    }

    const found = MOCK_USERS[username.trim().toLowerCase()];
    if (!found) {
      return { success: false, error: "Invalid username or password." };
    }

    localStorage.setItem(LS_KEY, JSON.stringify(found));
    setUser(found);
    return { success: true, user: found };
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
