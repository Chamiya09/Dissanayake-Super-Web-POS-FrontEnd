import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosInstance";
import { AppHeader } from "@/components/Layout/AppHeader";
import { formatCurrency } from "@/utils/formatCurrency";
import { BarChart3, Receipt, RotateCcw, PackageX, Boxes, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/context/GlobalToastContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type ManagerKpis = {
  todaysSales: number;
  pendingReturnsVoids: number;
  outOfStockItems: number;
};

type HourlySalesPoint = {
  hour: string;
  amount: number;
};

type LowStockItem = {
  productId: number;
  productName: string;
  stockQuantity: number;
  reorderLevel: number;
  productStatus?: string | null;
};

type ManagerDashboardData = {
  kpis: ManagerKpis;
  todaysHourlySales: HourlySalesPoint[];
  lowStockActionList: LowStockItem[];
};

const EMPTY_MANAGER_DATA: ManagerDashboardData = {
  kpis: {
    todaysSales: 0,
    pendingReturnsVoids: 0,
    outOfStockItems: 0,
  },
  todaysHourlySales: [],
  lowStockActionList: [],
};

const normalizeManagerData = (raw: any): ManagerDashboardData => {
  const hourlySales = Array.isArray(raw?.todaysHourlySales) ? raw.todaysHourlySales : [];
  const lowStockList = Array.isArray(raw?.lowStockActionList) ? raw.lowStockActionList : [];

  return {
    kpis: {
      todaysSales: Number(raw?.kpis?.todaysSales ?? raw?.todaysSales ?? 0),
      pendingReturnsVoids: Number(raw?.kpis?.pendingReturnsVoids ?? raw?.pendingReturnsVoids ?? 0),
      outOfStockItems: Number(raw?.kpis?.outOfStockItems ?? raw?.outOfStockItems ?? 0),
    },
    todaysHourlySales: hourlySales.map((point: any) => ({
      hour: String(point?.hour ?? ""),
      amount: Number(point?.amount ?? 0),
    })),
    lowStockActionList: lowStockList.map((item: any) => ({
      productId: Number(item?.productId ?? 0),
      productName: String(item?.productName ?? "Unknown Product"),
      stockQuantity: Number(item?.stockQuantity ?? 0),
      reorderLevel: Number(item?.reorderLevel ?? 0),
      productStatus: item?.productStatus ?? item?.status ?? null,
    })).filter((item: LowStockItem) => item.productStatus !== "DISCONTINUED"),
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
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData>(EMPTY_MANAGER_DATA);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/api/dashboard/manager-stats");
        setDashboardData(normalizeManagerData(response.data));
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to load manager dashboard data.";
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [showToast]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-none space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manager Dashboard</h1>
              <p className="text-sm text-slate-500">Daily operations and store performance control center.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard title="Today's Sales" value={formatCurrency(dashboardData.kpis.todaysSales)} icon={Receipt} iconClass="bg-emerald-100 text-emerald-700" />
            <KpiCard title="Pending Returns / Voids" value={String(dashboardData.kpis.pendingReturnsVoids)} icon={RotateCcw} iconClass="bg-amber-100 text-amber-700" />
            <KpiCard title="Out of Stock Items" value={String(dashboardData.kpis.outOfStockItems)} icon={PackageX} iconClass="bg-rose-100 text-rose-700" />
          </div>

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <p className="text-sm font-medium">Loading manager dashboard data...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Today's Hourly Sales</h2>
              <p className="text-xs text-slate-500">Real-time hourly sales from backend</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.todaysHourlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(Number(value || 0)), "Sales"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {dashboardData.todaysHourlySales.length === 0 && !loading && (
              <p className="mt-2 text-center text-sm text-slate-500">No completed sales recorded today.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.4fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
              <h3 className="text-base font-semibold text-slate-900">Quick Actions</h3>
              <p className="mb-4 text-xs text-slate-500">Jump directly to operational tasks</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => navigate("/products")}
                  className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-left transition hover:bg-indigo-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Add Product</p>
                    <p className="text-xs text-indigo-700">Create and publish a new product item</p>
                  </div>
                  <PlusCircle className="h-5 w-5 text-indigo-700" />
                </button>

                <button
                  onClick={() => navigate("/inventory")}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">View Inventory</p>
                    <p className="text-xs text-slate-600">Monitor stock and reorder levels</p>
                  </div>
                  <Boxes className="h-5 w-5 text-slate-700" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
              <h3 className="text-base font-semibold text-slate-900">Low Stock Action List</h3>
              <p className="mb-3 text-xs text-slate-500">Prioritize replenishment actions</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-right">Reorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.lowStockActionList.length === 0 ? (
                      <tr><td colSpan={3} className="px-3 py-5 text-center text-slate-500">All good. No low stock items.</td></tr>
                    ) : (
                      dashboardData.lowStockActionList.slice(0, 8).map((row) => (
                        <tr key={row.productId} className="border-t border-slate-100">
                          <td className="px-3 py-2">{row.productName}</td>
                          <td className="px-3 py-2 text-right font-semibold text-rose-700">{row.stockQuantity}</td>
                          <td className="px-3 py-2 text-right text-slate-700">{row.reorderLevel}</td>
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
