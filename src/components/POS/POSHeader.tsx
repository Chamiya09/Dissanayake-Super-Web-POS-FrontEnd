import { useState, useEffect } from "react";
import { User, Wifi } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function POSHeader() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-14 items-center border-b bg-card/80 backdrop-blur-md px-4">
      {/* Left — Sidebar trigger + user info */}
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none">Sarah M.</p>
            <p className="text-xs text-muted-foreground">Cashier</p>
          </div>
        </div>
      </div>

      {/* Center — Clock (always truly centered) */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold tabular-nums tracking-tight">
          {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <p className="text-xs text-muted-foreground">
          {time.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Right — Scanner status */}
      <div className="flex flex-1 items-center justify-end gap-2 text-sm text-muted-foreground">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 scanner-pulse" />
        <Wifi className="h-4 w-4 text-emerald-500" />
        <span className="hidden sm:inline">Scanner Connected</span>
      </div>
    </header>
  );
}
