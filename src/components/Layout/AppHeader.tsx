import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Wifi, LogOut, UserCircle, ChevronDown,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const PROFILE_PALETTE = {
  ring: "rgba(13, 148, 136, 0.18)",
  ringStrong: "rgba(13, 148, 136, 0.28)",
  badgeBg: "rgba(15, 118, 110, 0.12)",
  badgeBorder: "rgba(13, 148, 136, 0.30)",
};

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

export function AppHeader() {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isPOS = location.pathname === "/";

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
  };

  const goto = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const initials = getInitials(user?.name);
  const avatarGradient = ROLE_AVATAR_GRADIENT[user?.role as keyof typeof ROLE_AVATAR_GRADIENT] ?? "from-zinc-400 to-zinc-600";

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
      <div className="flex shrink-0 items-center">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-0">
        <p className="text-[17px] font-bold leading-none tracking-tight text-primary tabular-nums sm:text-[20px]">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
          {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isPOS && (
          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 lg:flex">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 scanner-pulse" />
            <Wifi className="h-3 w-3" />
            <span>Scanner Ready</span>
          </div>
        )}

        <div className="relative z-[100]" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            className={cn(
              "group flex h-11 min-w-[132px] items-center gap-2.5 rounded-2xl border pl-1.5 pr-1.5",
              "bg-gradient-to-r from-white via-white to-teal-50/70",
              "shadow-[0_10px_24px_-18px_rgba(13,148,136,0.55)] transition-all duration-200",
              menuOpen
                ? "border-teal-300/90 ring-2 ring-teal-500/15"
                : "border-slate-200/90 hover:-translate-y-[1px] hover:border-teal-300/80 hover:shadow-[0_16px_30px_-18px_rgba(13,148,136,0.6)]",
            )}
            style={{
              boxShadow: menuOpen
                ? `0 0 0 1px ${PROFILE_PALETTE.ringStrong}`
                : `0 0 0 1px ${PROFILE_PALETTE.ring}`,
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-teal-500/20 blur-[3px]" />
              <div className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white shadow-sm ring-2 ring-white",
                avatarGradient,
              )}>
                {initials}
              </div>
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white",
                ROLE_DOT[user?.role as keyof typeof ROLE_DOT],
              )} />
            </div>

            <div className="hidden min-w-0 flex-1 flex-col items-start leading-none sm:flex">
              <span className="max-w-[72px] truncate text-[12.5px] font-bold leading-tight text-slate-800">
                {user?.name?.split(" ")[0] ?? "Guest"}
              </span>
              <span className="mt-1 inline-flex items-center rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-teal-700">
                {user?.role}
              </span>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                menuOpen && "rotate-180",
              )} />
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-[120] mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-black/15 animate-in fade-in slide-in-from-top-2 duration-150 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40">
              <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-teal-50/70 to-cyan-50/60 px-4 py-3.5 dark:from-slate-800 dark:to-slate-800/70">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow ring-2 ring-white dark:ring-slate-900",
                  avatarGradient,
                )}>
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-foreground">{user?.name}</p>
                  <span
                    className={cn(
                      "mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-semibold",
                      ROLE_BADGE[user?.role as keyof typeof ROLE_BADGE],
                    )}
                    style={{
                      backgroundColor: PROFILE_PALETTE.badgeBg,
                      borderColor: PROFILE_PALETTE.badgeBorder,
                    }}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ROLE_DOT[user?.role as keyof typeof ROLE_DOT])} />
                    {user?.role}
                  </span>
                </div>
              </div>

              <div className="py-1.5">
                <DropdownItem icon={UserCircle} label="My Profile" onClick={() => goto("/profile")} />
              </div>

              <div className="border-t border-border py-1.5">
                <DropdownItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

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
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "text-red-500 dark:text-red-400" : "text-muted-foreground")} />
      {label}
    </button>
  );
}
