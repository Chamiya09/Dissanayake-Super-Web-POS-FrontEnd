import { useState, useEffect } from "react";
import { User, Wifi, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

/* ── Persist dark-mode to localStorage + sync <html> class ──────── */
function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("pos-dark") === "1"
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("pos-dark", dark ? "1" : "0");
  }, [dark]);
  return [dark, setDark] as const;
}

export function POSHeader() {
  const [time, setTime] = useState(new Date());
  const [dark, setDark] = useDarkMode();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-5 shadow-sm">

      {/* Left — Sidebar trigger + user info */}
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
            <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">Sarah M.</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">Cashier&nbsp;&middot;&nbsp;On shift</span>
          </div>
        </div>
      </div>

      {/* Center — Clock */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0.5 text-center">
        <p className="text-[16px] sm:text-[20px] font-bold tabular-nums tracking-tight leading-none text-primary">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="hidden sm:block text-[10px] font-medium text-muted-foreground uppercase tracking-[0.12em]">
          {time.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Right — Dark mode toggle + Scanner status */}
      <div className="flex flex-1 items-center justify-end gap-2">

        {/* Dark / Light toggle */}
        <button
          onClick={() => setDark((d) => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode (night shift)"}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Scanner status pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 scanner-pulse" />
          <Wifi className="h-3 w-3" />
          <span>Scanner Ready</span>
        </div>
      </div>
    </header>
  );
}
