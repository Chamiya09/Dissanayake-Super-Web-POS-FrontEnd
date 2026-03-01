import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  User, Wifi, Moon, Sun, Bell, LogOut,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";

/* ── Persist dark-mode across all pages ────────────────────────── */
export function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("pos-dark") === "1"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("pos-dark", dark ? "1" : "0");
  }, [dark]);
  return [dark, setDark] as const;
}

/* ── Shared header used by every page ──────────────────────────── */
export function AppHeader() {
  const [time, setTime] = useState(new Date());
  const [dark, setDark] = useDarkMode();
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const isPOS = location.pathname === "/";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-sm">

      {/* ── Left: sidebar trigger + user ── */}
      <div className="flex items-center gap-3 shrink-0">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
            <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">
              {user?.name ?? "Guest"}
            </span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              {user?.role ?? ""}&nbsp;&middot;&nbsp;{user?.role === "Staff" ? "On shift" : "Admin"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Center: live clock + date (all pages) ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0">
        <p className="text-[17px] sm:text-[20px] font-bold tabular-nums tracking-tight leading-none text-primary">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.12em] leading-none mt-0.5">
          {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* ── Right: bell + dark toggle + scanner (POS only) ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Bell */}
        <button
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">6</span>
        </button>

        {/* Dark / Light toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-red-400/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Scanner status — POS page only */}
        {isPOS && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 scanner-pulse" />
            <Wifi className="h-3 w-3" />
            <span>Scanner Ready</span>
          </div>
        )}
      </div>
    </header>
  );
}
