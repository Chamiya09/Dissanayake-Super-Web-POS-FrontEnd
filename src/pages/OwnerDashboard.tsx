import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axiosInstance";
import { AppHeader } from "@/components/Layout/AppHeader";
import { formatCurrency } from "@/utils/formatCurrency";
import { TrendingUp, Landmark, Users, AlertTriangle, Crown, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
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

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [auditRows, setAuditRows] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [salesRes, productsRes, usersRes, lowStockRes, auditRes] = await Promise.allSettled([
          api.get("/api/sales"),
          api.get("/api/products"),
          api.get("/api/users"),
          api.get("/api/inventory/low-stock"),
          api.get("/api/audit-logs", { params: { page: 0, size: 5 } }),
        ]);

        if (salesRes.status === "fulfilled") {
          setSales(Array.isArray(salesRes.value.data) ? salesRes.value.data : []);
        }
        if (productsRes.status === "fulfilled") {
          setProducts(Array.isArray(productsRes.value.data) ? productsRes.value.data : []);
        }
        if (usersRes.status === "fulfilled") {
          setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
        }
        if (lowStockRes.status === "fulfilled") {
          setLowStock(Array.isArray(lowStockRes.value.data) ? lowStockRes.value.data : []);
        }
        if (auditRes.status === "fulfilled") {
          setAuditRows(auditRes.value.data?.content ?? []);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const completedSales = useMemo(
    () => sales.filter((s) => String(s?.status || "").toLowerCase() === "completed"),
    [sales]
  );

  const totalRevenue = useMemo(
    () => completedSales.reduce((sum, s) => sum + Number(s?.totalAmount || 0), 0),
    [completedSales]
  );

  const netProfit = useMemo(() => {
    const productMap = new Map<number, any>();
    products.forEach((p) => productMap.set(Number(p.id), p));

    let profit = 0;
    completedSales.forEach((sale) => {
      (sale?.items || []).forEach((item: any) => {
        const p = productMap.get(Number(item?.productId));
        const unitSell = Number(item?.unitPrice || 0);
        const qty = Number(item?.quantity || 0);
        const unitBuy = Number(p?.buyingPrice || 0);
        profit += (unitSell - unitBuy) * qty;
      });
    });

    return profit;
  }, [completedSales, products]);

  const monthlyRevenue = useMemo(() => {
    const bucket = new Map<string, number>();
    completedSales.forEach((s) => {
      if (!s?.saleDate) return;
      const key = monthKey(s.saleDate);
      bucket.set(key, (bucket.get(key) || 0) + Number(s?.totalAmount || 0));
    });

    const sorted = Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([k, v]) => ({ month: monthLabel(k), revenue: Number(v.toFixed(2)) }));

    return sorted;
  }, [completedSales]);

  const topSelling = useMemo(() => {
    const qtyMap = new Map<string, number>();

    completedSales.forEach((sale) => {
      (sale?.items || []).forEach((item: any) => {
        const name = String(item?.productName || "Unknown Product");
        qtyMap.set(name, (qtyMap.get(name) || 0) + Number(item?.quantity || 0));
      });
    });

    return Array.from(qtyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, qty]) => ({ name, qty }));
  }, [completedSales]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-none space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Owner Dashboard</h1>
              <p className="text-sm text-slate-500">High-level business analytics and governance visibility.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} iconClass="bg-emerald-100 text-emerald-700" />
            <KpiCard title="Net Profit" value={formatCurrency(netProfit)} icon={Landmark} iconClass="bg-indigo-100 text-indigo-700" />
            <KpiCard title="Total Users" value={String(users.length)} icon={Users} iconClass="bg-sky-100 text-sky-700" />
            <KpiCard title="Low Stock Items" value={String(lowStock.length)} icon={AlertTriangle} iconClass="bg-amber-100 text-amber-700" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Monthly Revenue Trends</h2>
              <p className="text-xs text-slate-500">Completed sales over recent months</p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(Number(value || 0)), "Revenue"]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!loading && monthlyRevenue.length === 0 && (
              <p className="mt-2 text-center text-sm text-slate-500">No monthly sales data available yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Top Selling Products</h3>
              <p className="mb-3 text-xs text-slate-500">By sold quantity</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSelling.length === 0 ? (
                      <tr><td colSpan={2} className="px-3 py-5 text-center text-slate-500">No sales yet.</td></tr>
                    ) : (
                      topSelling.map((row) => (
                        <tr key={row.name} className="border-t border-slate-100">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-right font-semibold">{row.qty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Recent System Alerts / Audit</h3>
              <p className="mb-3 text-xs text-slate-500">Latest sensitive actions</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-5 text-center text-slate-500">
                          <div className="inline-flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-slate-400" />
                            No alerts found.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      auditRows.map((row: any) => (
                        <tr key={row.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{row.action}</td>
                          <td className="px-3 py-2 text-slate-600">{new Date(row.timestamp).toLocaleString()}</td>
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
