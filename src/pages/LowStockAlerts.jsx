import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import { useInventory } from "@/context/InventoryContext";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  AlertTriangle,
  PackageSearch,
  RefreshCw,
  DollarSign,
  ArrowRight,
} from "lucide-react";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    LOW_STOCK:    { dot: "bg-amber-500", cls: "bg-amber-500/10 text-amber-700 border border-amber-200 dark:text-amber-400 dark:border-amber-800", label: "Low Stock"    },
    OUT_OF_STOCK: { dot: "bg-red-500",   cls: "bg-red-500/10   text-red-700   border border-red-200   dark:text-red-400   dark:border-red-800",   label: "Out of Stock" },
  };
  const s = map[status] ?? { dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const DUMMY_ALERTS = [
  { inventoryId: -1, productId: -1, productName: "Basmati Rice (5 kg)",           sku: "RCE-001", category: "Dry Goods",   stockQuantity: 4,  reorderLevel: 20, unit: "bags",    stockStatus: "LOW_STOCK",    sellingPrice: 1250 },
  { inventoryId: -2, productId: -2, productName: "Sunflower Cooking Oil (1 L)",    sku: "OIL-002", category: "Oils & Fats",  stockQuantity: 0,  reorderLevel: 15, unit: "bottles", stockStatus: "OUT_OF_STOCK", sellingPrice: 480  },
  { inventoryId: -3, productId: -3, productName: "Full Cream Milk Powder (400 g)", sku: "MLK-003", category: "Dairy",        stockQuantity: 7,  reorderLevel: 25, unit: "tins",    stockStatus: "LOW_STOCK",    sellingPrice: 890  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LowStockAlerts() {
  const navigate = useNavigate();
  const { inventoryItems, analyticsLoading, refreshInventory } = useInventory();

  // Fetch directly from the dedicated endpoint
  const [apiAlerts,    setApiAlerts]    = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchAlerts = useCallback(() => {
    setAlertLoading(true);
    api.get("/api/inventory/low-stock")
      .then((r) => setApiAlerts(r.data ?? []))
      .catch(() => setApiAlerts([]))
      .finally(() => setAlertLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Filter + search state
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");

  // Analytics derived from InventoryContext
  const contextAlerts = useMemo(
    () => inventoryItems.filter((i) => i.stockStatus === "LOW_STOCK" || i.stockStatus === "OUT_OF_STOCK"),
    [inventoryItems]
  );
  const lowStockCount   = contextAlerts.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount = contextAlerts.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;
  const totalReorderValue = contextAlerts.reduce(
    (sum, i) => sum + Math.max(0, i.reorderLevel - i.stockQuantity) * i.sellingPrice, 0
  );

  // Source priority: API endpoint → context alerts → dummy data
  const alertSource = useMemo(() => {
    if (apiAlerts.length   > 0) return apiAlerts;
    if (contextAlerts.length > 0) return contextAlerts;
    return DUMMY_ALERTS;
  }, [apiAlerts, contextAlerts]);

  const isDummy = alertSource === DUMMY_ALERTS;

  const visibleAlerts = useMemo(() => {
    return alertSource
      .filter((i) => statusFilter === "all" || i.stockStatus === statusFilter)
      .filter((i) => {
        const q = search.trim().toLowerCase();
        return !q || i.productName.toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q);
      });
  }, [alertSource, statusFilter, search]);

  const isLoading = analyticsLoading || alertLoading;

  function handlePrepareOrder(item) {
    navigate("/reorder", { state: { product: item } });
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <div className="flex-1 overflow-y-auto space-y-6 px-4 sm:px-6 py-6">

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 shrink-0">
              <AlertTriangle className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                Low Stock Alerts
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Products at or below their reorder threshold — act before stock runs out.
              </p>
            </div>
          </div>
          <button
            onClick={() => { refreshInventory(); fetchAlerts(); }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 self-start shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Analytics cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            label="Low Stock Items"
            value={analyticsLoading ? "—" : lowStockCount}
            sub="Products below reorder level"
          />
          <SummaryCard
            icon={PackageSearch}
            iconBg="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            label="Out of Stock"
            value={analyticsLoading ? "—" : outOfStockCount}
            sub="Requires immediate reorder"
          />
          <SummaryCard
            icon={DollarSign}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
            label="Est. Reorder Value"
            value={analyticsLoading ? "—" : formatCurrency(totalReorderValue)}
            sub="Cost to restock all alerts"
          />
        </div>

        {/* ── Filter + search ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 p-1">
            {[{ k: "all", l: "All" }, { k: "LOW_STOCK", l: "Low Stock" }, { k: "OUT_OF_STOCK", l: "Out of Stock" }].map((t) => (
              <button
                key={t.k}
                onClick={() => setStatusFilter(t.k)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 ${
                  statusFilter === t.k
                    ? "bg-slate-900 text-white shadow-sm dark:bg-slate-50 dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <input
              type="text"
              placeholder="Search by product or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 focus:border-slate-400 dark:focus:border-slate-600 transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="ml-auto h-4 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <PackageSearch className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-1" strokeWidth={1.2} />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {alertSource.length === 0 ? "All products are well-stocked!" : "No items match your filters."}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {alertSource.length === 0
                  ? "No low-stock or out-of-stock alerts at the moment."
                  : "Try adjusting the filter or search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                    {[
                      { h: "Product Name",  align: "text-left"   },
                      { h: "Category",      align: "text-left"   },
                      { h: "Current Stock", align: "text-center" },
                      { h: "Reorder Level", align: "text-center" },
                      { h: "Status",        align: "text-center" },
                      { h: "Action",        align: "text-center" },
                    ].map(({ h, align }) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap ${align}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleAlerts.map((item, idx) => (
                    <tr
                      key={item.inventoryId}
                      className={[
                        "border-b border-slate-100 dark:border-slate-800 last:border-0",
                        "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150",
                        idx % 2 !== 0 ? "bg-slate-50/30 dark:bg-slate-800/[0.15]" : "",
                      ].join(" ")}
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-50 leading-tight">{item.productName}</p>
                        {item.sku && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{item.sku}</p>}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 px-2 py-0.5 text-[12px] font-medium text-slate-600 dark:text-slate-300">
                          {item.category ?? "—"}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                            item.stockQuantity === 0
                              ? "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800"
                              : "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800"
                          }`}
                        >
                          {item.stockQuantity}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-[13px] tabular-nums font-medium text-slate-600 dark:text-slate-300">
                          {item.reorderLevel}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.stockStatus} />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handlePrepareOrder(item)}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-[13px] font-semibold text-white shadow-md shadow-amber-500/20 transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:bg-amber-500 dark:hover:bg-amber-600 dark:focus:ring-offset-slate-900"
                        >
                          Prepare Order
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ── Footer count ── */}
          {!isLoading && visibleAlerts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {isDummy ? "Showing sample data — live inventory not yet available." : (
                  <>Showing{" "}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{visibleAlerts.length}</span>
                    {" "}of{" "}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{alertSource.length}</span>
                    {" "}alert{alertSource.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Row count / source note — keep as spacing only when no footer shown */}
        {!isLoading && visibleAlerts.length === 0 && (
          <p className="text-[12px] text-slate-400 dark:text-slate-500">
            {isDummy ? "Showing sample data — live inventory not yet available." : ""}
          </p>
        )}

      </div>
    </div>
  );
}
