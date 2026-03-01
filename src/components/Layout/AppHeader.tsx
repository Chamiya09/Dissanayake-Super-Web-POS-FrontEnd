import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Wifi, Moon, Sun, Bell, LogOut, UserCircle, Settings, ChevronDown,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/* ── Role colours (badge + avatar gradient) ────────────────────── */
const ROLE_BADGE = {
  Owner:   "bg-red-100   text-red-700   border-red-200   dark:bg-red-900/20   dark:text-red-400   dark:border-red-800",
  Manager: "bg-blue-100  text-blue-700  border-blue-200  dark:bg-blue-900/20  dark:text-blue-400  dark:border-blue-800",
  Staff:   "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
};
const ROLE_DOT = { Owner: "bg-red-500", Manager: "bg-blue-500", Staff: "bg-green-500" };
const ROLE_AVATAR_GRADIENT = {
  Owner:   "from-red-400   to-red-600",
  Manager: "from-blue-400  to-blue-600",
  Staff:   "from-green-400 to-green-600",
};

function getInitials(name: string | undefined) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

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
  const [time, setTime]       = useState(new Date());
  const [dark, setDark]       = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef               = useRef<HTMLDivElement>(null);

  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const isPOS = location.pathname === "/";

  /* Clock tick */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const goto = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const initials = getInitials(user?.name);
  const avatarGradient = ROLE_AVATAR_GRADIENT[user?.role as keyof typeof ROLE_AVATAR_GRADIENT] ?? "from-zinc-400 to-zinc-600";

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 shadow-sm">

      {/* ── Left: sidebar trigger ── */}
      <div className="flex items-center shrink-0">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
      </div>

      {/* ── Center: live clock + date ── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0">
        <p className="text-[17px] sm:text-[20px] font-bold tabular-nums tracking-tight leading-none text-primary">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.12em] leading-none mt-0.5">
          {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* ── Right: bell + dark toggle + scanner + avatar ── */}
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

        {/* Scanner status — POS page only */}
        {isPOS && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 scanner-pulse" />
            <Wifi className="h-3 w-3" />
            <span>Scanner Ready</span>
          </div>
        )}

        {/* ── Avatar + Dropdown ── */}
        <div className="relative" ref={menuRef}>
          {/* Avatar button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className={cn(
              "flex h-9 items-center gap-2 rounded-xl border border-border bg-secondary pl-1 pr-2.5",
              "transition-all hover:border-primary/40 hover:bg-muted",
              menuOpen && "border-primary/40 bg-muted ring-2 ring-primary/15"
            )}
          >
            {/* Initials circle */}
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white shadow-sm",
              avatarGradient
            )}>
              {initials}
            </div>

            {/* Name + role (hidden on small screens) */}
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[12px] font-semibold text-foreground leading-tight">
                {user?.name?.split(" ")[0] ?? "Guest"}
              </span>
              <span className="text-[10px] text-muted-foreground">{user?.role}</span>
            </div>

            <ChevronDown className={cn(
              "ml-0.5 h-3 w-3 text-muted-foreground transition-transform duration-200",
              menuOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown panel */}
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

              {/* User info header */}
              <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3.5">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow",
                  avatarGradient
                )}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">{user?.name}</p>
                  <span className={cn(
                    "mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold",
                    ROLE_BADGE[user?.role as keyof typeof ROLE_BADGE]
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ROLE_DOT[user?.role as keyof typeof ROLE_DOT])} />
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <DropdownItem
                  icon={UserCircle}
                  label="My Profile"
                  onClick={() => goto("/profile")}
                />
                <DropdownItem
                  icon={Settings}
                  label="Settings"
                  onClick={() => goto("/settings")}
                />
              </div>

              {/* Logout — separated by border */}
              <div className="border-t border-border py-1.5">
                <DropdownItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={handleLogout}
                  danger
                />
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Dropdown item ──────────────────────────────────────────────── */
function DropdownItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-red-500" : "text-muted-foreground")} />
      {label}
    </button>
  );
}
