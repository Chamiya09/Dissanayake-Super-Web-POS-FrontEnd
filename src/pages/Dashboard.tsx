import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Package, Truck, LayoutDashboard } from "lucide-react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ── Mock chart data (replace with API data later) ─────────────────────── */
const salesTrendData = [
  { name: "Mon", amount: 12400 },
  { name: "Tue", amount: 8700 },
  { name: "Wed", amount: 15200 },
  { name: "Thu", amount: 9800 },
  { name: "Fri", amount: 22100 },
  { name: "Sat", amount: 18600 },
  { name: "Sun", amount: 5300 },
];

const paymentData = [
  { name: "Cash", value: 64 },
  { name: "Card", value: 36 },
];

const PIE_COLORS = ["#10b981", "#6366f1"];

const tooltipStyle = {
  borderRadius: 8,
  fontSize: 12,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

const tickStyle = { fontSize: 12, fill: "hsl(var(--muted-foreground))" } as const;
const gridColor = "hsl(var(--border))";

/*  Formatting helpers  */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/*  Types  */
interface RecentSale {
  id: number;
  receiptNo: string;
  saleDate: string;
  totalAmount: number;
  status: string;
}

interface DashboardStats {
  revenue: number;
  products: number;
  suppliers: number;
}

/*  Metric card component  */
function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
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
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

/*  Dashboard page  */
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    products: 0,
    suppliers: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [salesRes, productsRes, suppliersRes] = await Promise.allSettled([
          axios.get<RecentSale[]>("http://localhost:8080/api/sales"),
          axios.get<unknown[]>("http://localhost:8080/api/products"),
          axios.get<unknown[]>("http://localhost:8080/api/suppliers"),
        ]);

        //  Sales 
        if (salesRes.status === "fulfilled") {
          const salesData = Array.isArray(salesRes.value.data)
            ? salesRes.value.data
            : (salesRes.value.data as { content?: RecentSale[] }).content ?? [];

          const completedSales = salesData.filter((s) => s.status === "Completed");
          const revenue = completedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);

          const latest = [...salesData]
            .sort((a, b) => b.id - a.id)
            .slice(0, 5);

          setStats((prev) => ({ ...prev, revenue }));
          setRecentSales(latest);
        }

        //  Products 
        if (productsRes.status === "fulfilled") {
          const arr = Array.isArray(productsRes.value.data)
            ? productsRes.value.data
            : (productsRes.value.data as { content?: unknown[] }).content ?? [];
          setStats((prev) => ({ ...prev, products: arr.length }));
        }

        //  Suppliers 
        if (suppliersRes.status === "fulfilled") {
          const arr = Array.isArray(suppliersRes.value.data)
            ? suppliersRes.value.data
            : (suppliersRes.value.data as { content?: unknown[] }).content ?? [];
          setStats((prev) => ({ ...prev, suppliers: arr.length }));
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
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

        {/*  Page title  */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Overview of your sales, products, and suppliers
            </p>
          </div>
        </div>

        {/*  Metric cards  */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MetricCard
            label="Total Sales Revenue"
            value={isLoading ? "" : formatCurrency(stats.revenue)}
            sub="From completed transactions"
            icon={TrendingUp}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <MetricCard
            label="Total Products"
            value={isLoading ? "" : stats.products}
            sub="Items in inventory"
            icon={Package}
            iconBg="bg-indigo-500/10"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            label="Registered Suppliers"
            value={isLoading ? "" : stats.suppliers}
            sub="Active supplier accounts"
            icon={Truck}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-600 dark:text-orange-400"
          />
        </div>

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
                    formatter={(v: number) => [
                      new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(v),
                      "Revenue",
                    ]}
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
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {paymentData.map((_entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`${v}%`, "Share"]}
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

        {/*  Recent Sales  */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">

          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Recent Sales</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Last 5 transactions</p>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Loading recent sales...
            </div>
          )}

          {!isLoading && (
            <div className="overflow-x-auto">
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