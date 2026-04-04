import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Wifi, Moon, Sun, Bell, LogOut, UserCircle, ChevronDown,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

/* ── Profile palette aligned to the app's teal/slate theme ─────── */
const PROFILE_PALETTE = {
  ring: "rgba(13, 148, 136, 0.18)",
  ringStrong: "rgba(13, 148, 136, 0.28)",
  badgeBg: "rgba(15, 118, 110, 0.12)",
  badgeBorder: "rgba(13, 148, 136, 0.30)",
};

/* ── Role colours (badge + avatar gradient) ────────────────────── */
const ROLE_BADGE = {
  Owner:   "bg-teal-100  text-teal-700  border-teal-200",
  Manager: "bg-cyan-100  text-cyan-700  border-cyan-200",
  Staff:   "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const ROLE_DOT = { Owner: "bg-teal-500", Manager: "bg-cyan-500", Staff: "bg-emerald-500" };
const ROLE_AVATAR_GRADIENT = {
  Owner:   "from-teal-500  to-teal-700",
  Manager: "from-cyan-500  to-cyan-700",
  Staff:   "from-emerald-500 to-emerald-700",
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
    logout(); // logout() handles navigate("/login") internally
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
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
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
              "group flex h-10 items-center gap-2 rounded-xl border pl-1 pr-2.5",
              "bg-gradient-to-r from-white to-slate-50/90 dark:from-slate-900 dark:to-slate-800/70",
              "transition-all hover:shadow-md hover:shadow-teal-500/10",
              menuOpen
                ? "border-teal-300/80 ring-2 ring-teal-500/20"
                : "border-slate-200/90 hover:border-teal-300/70"
            )}
            style={{
              boxShadow: menuOpen
                ? `0 0 0 1px ${PROFILE_PALETTE.ringStrong}`
                : `0 0 0 1px ${PROFILE_PALETTE.ring}`,
            }}
          >
            {/* Initials circle */}
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-teal-500/20 blur-[2px]" />
              <div className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900",
                avatarGradient
              )}>
                {initials}
              </div>
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white dark:border-slate-900",
                ROLE_DOT[user?.role as keyof typeof ROLE_DOT]
              )} />
            </div>

            {/* Name + role (hidden on small screens) */}
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.name?.split(" ")[0] ?? "Guest"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role}</span>
            </div>

            <ChevronDown className={cn(
              "ml-0.5 h-3 w-3 text-slate-500 transition-transform duration-200 group-hover:text-teal-600",
              menuOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown panel */}
          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">

              {/* User info header */}
              <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-teal-50/70 to-cyan-50/60 px-4 py-3.5 dark:from-slate-800 dark:to-slate-800/70">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow ring-2 ring-white dark:ring-slate-900",
                  avatarGradient
                )}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">{user?.name}</p>
                  <span className={cn(
                    "mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold",
                    ROLE_BADGE[user?.role as keyof typeof ROLE_BADGE]
                  )}
                  style={{
                    backgroundColor: PROFILE_PALETTE.badgeBg,
                    borderColor: PROFILE_PALETTE.badgeBorder,
                  }}>
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
          ? "text-red-600 hover:bg-red-50"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-red-500" : "text-muted-foreground")} />
      {label}
    </button>
  );
}
