import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";
import { InventoryAnalyticsCards } from "@/components/Inventory/InventoryAnalyticsCards";
import { AIPredictionsCard } from "@/components/Dashboard/AIPredictionsCard";
import { SkeletonTable, SkeletonCard } from "@/components/ui/SkeletonTable";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  MonitorPlay,
  Receipt,
  Clock,
  TrendingUp,
  Package,
  Truck,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   Chart style constants (mirrors Dashboard.tsx)
   ───────────────────────────────────────────────────────────────────────── */
const PIE_COLORS = ["#10b981", "#6366f1"];

const tooltipStyle = {
  borderRadius: 8,
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

const tickStyle = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const gridColor = "hsl(var(--border))";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ─────────────────────────────────────────────────────────────────────────
   Shift start — stored in localStorage
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

/* ─────────────────────────────────────────────────────────────────────────
   Metric card (same as Dashboard.tsx MetricCard)
   ───────────────────────────────────────────────────────────────────────── */
function MetricCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Shift stat card (small card for welcome section)
   ───────────────────────────────────────────────────────────────────────── */
function ShiftCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums leading-none text-foreground">{value}</p>
        {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
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

  /* ── Dashboard state (mirrors Dashboard.tsx) ── */
  const [stats, setStats] = useState({ revenue: 0, products: 0, suppliers: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesTrendData, setSalesTrendData] = useState([]);
  const [paymentData, setPaymentData] = useState([
    { name: "Cash", value: 0 },
    { name: "Card", value: 0 },
  ]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [salesRes, productsRes, suppliersRes] = await Promise.allSettled([
          api.get("/api/sales"),
          api.get("/api/products"),
          api.get("/api/suppliers"),
        ]);

        // Sales
        if (salesRes.status === "fulfilled") {
          const salesData = Array.isArray(salesRes.value.data)
            ? salesRes.value.data
            : salesRes.value.data?.content ?? [];

          const completedSales = salesData.filter((s) => s.status === "Completed");
          const revenue = completedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
          const latest = [...salesData].sort((a, b) => b.id - a.id).slice(0, 5);

          setStats((prev) => ({ ...prev, revenue }));
          setRecentSales(latest);

          // Weekly trend (last 7 days)
          const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const now = new Date();
          const trendData = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (6 - i));
            const dayStr = d.toDateString();
            const amount = salesData
              .filter(
                (s) =>
                  s.status === "Completed" &&
                  s.saleDate &&
                  new Date(s.saleDate).toDateString() === dayStr,
              )
              .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
            return { name: DAY_NAMES[d.getDay()], amount };
          });
          setSalesTrendData(trendData);

          // Payment method split
          const cashCnt = completedSales.filter((s) => s.paymentMethod === "Cash").length;
          const cardCnt = completedSales.filter((s) => s.paymentMethod === "Card").length;
          const payTotal = cashCnt + cardCnt;
          setPaymentData([
            { name: "Cash", value: payTotal > 0 ? Math.round((cashCnt / payTotal) * 100) : 0 },
            { name: "Card", value: payTotal > 0 ? Math.round((cardCnt / payTotal) * 100) : 0 },
          ]);
        }

        // Products
        if (productsRes.status === "fulfilled") {
          const arr = Array.isArray(productsRes.value.data)
            ? productsRes.value.data
            : productsRes.value.data?.content ?? [];
          setStats((prev) => ({ ...prev, products: arr.length }));
        }

        // Suppliers
        if (suppliersRes.status === "fulfilled") {
          const arr = Array.isArray(suppliersRes.value.data)
            ? suppliersRes.value.data
            : suppliersRes.value.data?.content ?? [];
          setStats((prev) => ({ ...prev, suppliers: arr.length }));
        }
      } catch (err) {
        console.error("StaffDashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Welcome bar ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Good {getGreeting()},{" "}
            <span className="text-primary">{user?.name?.split(" ")[0] ?? "Staff"}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's a quick overview of your shift and the store today.
          </p>
        </div>

        {/* ── Shift info + Open POS ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ShiftCard
            icon={Clock}
            label="Shift Start Time"
            value={formatTime(shiftStart)}
            sub={`${getElapsed(shiftStart)} elapsed`}
            accent="bg-amber-500/10 text-amber-600"
          />
          <ShiftCard
            icon={Receipt}
            label="Cashier"
            value={user?.name ?? "Staff"}
            sub={user?.role ?? ""}
            accent="bg-violet-500/10 text-violet-600"
          />
          {/* Open POS Terminal button spans remaining column on sm+ */}
          <button
            onClick={() => navigate("/")}
            className={cn(
              "group flex items-center justify-between gap-4",
              "rounded-2xl border-2 border-primary/20 bg-primary/5 px-5 py-4",
              "transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10",
              "active:scale-[0.99]",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
                <MonitorPlay className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-foreground">Open POS Terminal</p>
                <p className="text-xs text-muted-foreground">Start a new transaction</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* ── Page title (dashboard section) ── */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">Store Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview of sales, products, and suppliers
            </p>
          </div>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <MetricCard
                label="Total Sales Revenue"
                value={formatCurrency(stats.revenue)}
                sub="From completed transactions"
                icon={TrendingUp}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                label="Total Products"
                value={stats.products}
                sub="Items in inventory"
                icon={Package}
                iconBg="bg-indigo-500/10"
                iconColor="text-indigo-600 dark:text-indigo-400"
              />
              <MetricCard
                label="Registered Suppliers"
                value={stats.suppliers}
                sub="Active supplier accounts"
                icon={Truck}
                iconBg="bg-orange-500/10"
                iconColor="text-orange-600 dark:text-orange-400"
              />
            </>
          )}
        </div>

        {/* ── Inventory Analytics ── */}
        <InventoryAnalyticsCards />

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Bar chart — Weekly Sales Revenue */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Weekly Sales Revenue</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Last 7 days · LKR</p>
            </div>
            <div className="px-4 py-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesTrendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke={gridColor} />
                  <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "hsl(var(--primary)/0.06)" }}
                    formatter={(v) => [formatCurrency(v), "Revenue"]}
                  />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart — Sales by Payment Method */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Sales by Payment Method</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Cash vs Card split</p>
            </div>
            <div className="flex items-center justify-center px-4 py-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentData.map((_entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${v}%`, "Share"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* ── AI Predictions ── */}
        <AIPredictionsCard />

        {/* ── Recent Sales ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Recent Sales</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Last 5 transactions</p>
            </div>
          </div>

          {isLoading && (
            <SkeletonTable
              rows={5}
              columns={[
                { width: "w-28" },
                { width: "w-36", flexible: true },
                { width: "w-28", align: "right" },
              ]}
            />
          )}

          {!isLoading && (
            <div className="overflow-x-auto transition-opacity duration-300 opacity-100">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="w-[30%] px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Receipt No.
                    </th>
                    <th className="w-[35%] px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="w-[35%] px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!recentSales || recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-16 text-center text-sm text-muted-foreground">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.id} className="group transition-colors hover:bg-muted/40">
                        <td className="px-6 py-4">
                          <span className="font-mono text-[13px] font-bold tracking-tight text-primary">
                            {sale?.receiptNo || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] text-foreground">
                            {sale?.saleDate ? formatDate(sale.saleDate) : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">
                            {formatCurrency(sale?.totalAmount || 0)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && (
            <div className="border-t border-border bg-muted/30 px-6 py-3">
              <p className="text-[11px] text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">{recentSales.length}</span>{" "}
                most recent transaction{recentSales.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
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
