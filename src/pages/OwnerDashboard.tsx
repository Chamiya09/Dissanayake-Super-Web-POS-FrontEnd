import { useEffect, useMemo, useState, type ElementType } from "react";
import api from "@/lib/axiosInstance";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  TrendingUp,
  Landmark,
  Users,
  AlertTriangle,
  Crown,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type OwnerKpis = {
  totalRevenue: number;
  netProfit: number;
  totalUsers: number;
  lowStockItems: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
};

type CategoryPoint = {
  category: string;
  value: number;
};

type TopSellingProduct = {
  name: string;
  qty: number;
};

type OwnerDashboardData = {
  kpis: OwnerKpis;
  last30DaysRevenueTrend: RevenuePoint[];
  salesByCategory: CategoryPoint[];
  topSellingProducts: TopSellingProduct[];
};

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const OWNER_ACCENT = "#5b8def";

const EMPTY_OWNER_DATA: OwnerDashboardData = {
  kpis: {
    totalRevenue: 0,
    netProfit: 0,
    totalUsers: 0,
    lowStockItems: 0,
  },
  last30DaysRevenueTrend: [],
  salesByCategory: [],
  topSellingProducts: [],
};

const formatTrendDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const normalizeOwnerData = (raw: any): OwnerDashboardData => {
  const trend = Array.isArray(raw?.last30DaysRevenueTrend) ? raw.last30DaysRevenueTrend : [];
  const category = Array.isArray(raw?.salesByCategory) ? raw.salesByCategory : [];
  const topSelling = Array.isArray(raw?.topSellingProducts) ? raw.topSellingProducts : [];

  return {
    kpis: {
      totalRevenue: Number(raw?.kpis?.totalRevenue ?? raw?.totalRevenue ?? 0),
      netProfit: Number(raw?.kpis?.netProfit ?? raw?.netProfit ?? 0),
      totalUsers: Number(raw?.kpis?.totalUsers ?? raw?.totalUsers ?? 0),
      lowStockItems: Number(raw?.kpis?.lowStockItems ?? raw?.lowStockItems ?? 0),
    },
    last30DaysRevenueTrend: trend.map((point: any) => ({
      date: String(point?.date ?? ""),
      revenue: Number(point?.revenue ?? 0),
    })),
    salesByCategory: category.map((point: any) => ({
      category: String(point?.category ?? "Uncategorized"),
      value: Number(point?.value ?? 0),
    })),
    topSellingProducts: topSelling.map((product: any, index: number) => ({
      name: String(product?.name ?? `Product ${index + 1}`),
      qty: Number(product?.qty ?? product?.quantity ?? 0),
    })),
  };
};

function KpiCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string;
    value: string;
  icon: ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-[#2A2A40] dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default function OwnerDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData>(EMPTY_OWNER_DATA);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/api/dashboard/owner-stats");
        setDashboardData(normalizeOwnerData(response.data));
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to load owner dashboard data.";
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [showToast]);

  const trendData = useMemo(
    () =>
      dashboardData.last30DaysRevenueTrend.map((point) => ({
        date: formatTrendDate(point.date),
        revenue: point.revenue,
      })),
    [dashboardData.last30DaysRevenueTrend]
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-background dark:text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-none space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Owner Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">High-level business analytics and governance visibility.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(dashboardData.kpis.totalRevenue)}
              icon={TrendingUp}
              iconClass="bg-emerald-100 text-emerald-700"
            />
            <KpiCard
              title="Net Profit"
              value={formatCurrency(dashboardData.kpis.netProfit)}
              icon={Landmark}
              iconClass="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            />
            <KpiCard
              title="Total Users"
              value={String(dashboardData.kpis.totalUsers)}
              icon={Users}
              iconClass="bg-sky-100 text-sky-700"
            />
            <KpiCard
              title="Low Stock Items"
              value={String(dashboardData.kpis.lowStockItems)}
              icon={AlertTriangle}
              iconClass="bg-amber-100 text-amber-700"
            />
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md dark:border-slate-700 dark:bg-[#2A2A40]">
              <div className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-300" />
                <p className="text-sm font-medium">Loading owner dashboard data...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-[#2A2A40]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last 30 Days Revenue Trend</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Interactive area chart from real backend revenue data</p>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="ownerRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={OWNER_ACCENT} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={OWNER_ACCENT} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.35} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(Number(value || 0)), "Revenue"]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #475569", backgroundColor: "#1E1E1E", color: "#E0E0E0" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={OWNER_ACCENT}
                        strokeWidth={3}
                        fill="url(#ownerRevenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {trendData.length === 0 && (
                  <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">No revenue trend data available.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-[#2A2A40]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sales by Category</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Category mix with hover details</p>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.salesByCategory}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={115}
                        paddingAngle={3}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dashboardData.salesByCategory.map((entry, index) => (
                          <Cell
                            key={`${entry.category}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name, payload) => [
                          formatCurrency(Number(value || 0)),
                          payload?.payload?.category || "Category",
                        ]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #475569", backgroundColor: "#1E1E1E", color: "#E0E0E0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {dashboardData.salesByCategory.length === 0 && (
                  <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">No category sales data available.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-[#2A2A40]">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Top Selling Products</h3>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">By sold quantity</p>
              <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topSellingProducts.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-5 text-center text-slate-500 dark:text-slate-400">
                          No product performance data yet.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.topSellingProducts.map((row) => (
                        <tr key={row.name} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{row.name}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{row.qty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
