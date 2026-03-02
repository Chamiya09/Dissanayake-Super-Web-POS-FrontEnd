import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  MonitorPlay,
  Receipt,
  Clock,
  TrendingUp,
  ShoppingCart,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Mock shift start — in real app this would come from session / API
   ───────────────────────────────────────────────────────────────────────── */
function getShiftStart() {
  const LS_KEY = "pos_shift_start";
  let ts = localStorage.getItem(LS_KEY);
  if (!ts) {
    ts = new Date().toISOString();
    localStorage.setItem(LS_KEY, ts);
  }
  return new Date(ts);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ─────────────────────────────────────────────────────────────────────────
   Mock recent transactions for the logged-in staff member
   ───────────────────────────────────────────────────────────────────────── */
const BASE_DATE = new Date();

function minsAgo(n, extraSecs = 0) {
  return new Date(BASE_DATE.getTime() - n * 60_000 - extraSecs * 1000).toISOString();
}

const MOCK_TRANSACTIONS = [
  { id: "TXN-0041", time: minsAgo(4),  items: 3, total: 1_250.00, method: "Cash",  status: "Completed" },
  { id: "TXN-0040", time: minsAgo(22), items: 7, total: 3_875.50, method: "Card",  status: "Completed" },
  { id: "TXN-0039", time: minsAgo(47), items: 2, total:   620.00, method: "Cash",  status: "Completed" },
  { id: "TXN-0038", time: minsAgo(65), items: 5, total: 2_140.75, method: "Card",  status: "Completed" },
  { id: "TXN-0037", time: minsAgo(89), items: 1, total:   315.00, method: "Cash",  status: "Completed" },
];

const PAYMENT_BADGE = {
  Cash: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Card: "bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-900/20   dark:text-blue-400   dark:border-blue-800",
};

/* ─────────────────────────────────────────────────────────────────────────
   Stat Card
   ───────────────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={cn(
      "flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm",
    )}>
      <div className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        accent,
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums leading-none text-foreground">
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   StaffDashboard page
   ───────────────────────────────────────────────────────────────────────── */
export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const shiftStart = useMemo(() => getShiftStart(), []);

  /* Aggregate stats from mock data */
  const totalSales   = MOCK_TRANSACTIONS.reduce((s, t) => s + t.total, 0);
  const totalTxns    = MOCK_TRANSACTIONS.length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">

          {/* ── Welcome bar ── */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Good {getGreeting()},{" "}
              <span className="text-primary">{user?.name?.split(" ")[0] ?? "Staff"}</span> 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Here's a quick overview of your shift so far.
            </p>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={TrendingUp}
              label="My Total Sales Today"
              value={formatCurrency(totalSales)}
              sub="From all completed transactions"
              accent="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              icon={Receipt}
              label="Total Transactions"
              value={totalTxns}
              sub="Completed this shift"
              accent="bg-violet-500/10 text-violet-600"
            />
            <StatCard
              icon={Clock}
              label="Shift Start Time"
              value={formatTime(shiftStart)}
              sub={`${getElapsed(shiftStart)} elapsed`}
              accent="bg-amber-500/10 text-amber-600"
            />
          </div>

          {/* ── Open POS Terminal CTA ── */}
          <button
            onClick={() => navigate("/")}
            className={cn(
              "group flex w-full items-center justify-between gap-4",
              "rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 py-5",
              "transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10",
              "active:scale-[0.99]",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                <MonitorPlay className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[17px] font-bold text-foreground">Open POS Terminal</p>
                <p className="text-sm text-muted-foreground">
                  Start a new transaction on the checkout screen
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </button>

          {/* ── Recent Sales table ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-[15px] font-bold text-foreground">My Recent Transactions</h2>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Last {MOCK_TRANSACTIONS.length}
              </span>
            </div>

            <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Receipt #
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Items
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {MOCK_TRANSACTIONS.map((txn) => (
                    <tr key={txn.id} className="transition-colors hover:bg-muted/30">
                      {/* Receipt # */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {txn.id}
                      </td>
                      {/* Time */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(txn.time)}
                      </td>
                      {/* Items */}
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-foreground">
                        {txn.items}
                      </td>
                      {/* Total */}
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                        {formatCurrency(txn.total)}
                      </td>
                      {/* Payment method */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          PAYMENT_BADGE[txn.method],
                        )}>
                          {txn.method}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <BadgeCheck className="h-3 w-3" />
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="border-t border-border bg-muted/30 px-4 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Showing last{" "}
                  <span className="font-semibold text-foreground">{MOCK_TRANSACTIONS.length}</span>{" "}
                  transactions for{" "}
                  <span className="font-semibold text-foreground">{user?.name}</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getElapsed(start) {
  const mins = Math.floor((Date.now() - start.getTime()) / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
