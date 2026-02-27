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
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-white px-5 shadow-sm">

      {/* Left — Sidebar trigger + user info */}
      <div className="flex flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
            <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[13px] font-semibold leading-none text-foreground">Sarah M.</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">Cashier&nbsp;·&nbsp;On shift</span>
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

      {/* Right — Scanner status */}
      <div className="flex flex-1 items-center justify-end gap-2">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 scanner-pulse" />
          <Wifi className="h-3 w-3" />
          <span>Scanner Ready</span>
        </div>
      </div>
    </header>
  );
}
