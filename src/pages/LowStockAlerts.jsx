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
    LOW_STOCK:    { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", label: "Low Stock"    },
    OUT_OF_STOCK: { cls: "bg-red-100   text-red-700   dark:bg-red-900/20   dark:text-red-400",   label: "Out of Stock" },
  };
  const s = map[status] ?? { cls: "bg-muted text-muted-foreground", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">{label}</p>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground dark:text-white">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground dark:text-gray-400">{sub}</p>}
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
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-white">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Low Stock Alerts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
              Products at or below their reorder threshold — act before stock runs out.
            </p>
          </div>
          <button
            onClick={() => { refreshInventory(); fetchAlerts(); }}
            disabled={isLoading}
            className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:opacity-50 dark:border-gray-700 dark:text-gray-100 sm:self-auto"
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
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 dark:border-gray-700 dark:bg-gray-800">
            {[{ k: "all", l: "All" }, { k: "LOW_STOCK", l: "Low Stock" }, { k: "OUT_OF_STOCK", l: "Out of Stock" }].map((t) => (
              <button
                key={t.k}
                onClick={() => setStatusFilter(t.k)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === t.k
                    ? "bg-background text-foreground shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-100"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by product or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-72"
          />
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-border dark:divide-gray-700">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted dark:bg-gray-700" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted dark:bg-gray-700" />
                  <div className="ml-auto h-4 w-28 animate-pulse rounded bg-muted dark:bg-gray-700" />
                </div>
              ))}
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground dark:text-gray-100">
                {alertSource.length === 0 ? "All products are well-stocked!" : "No items match your search."}
              </p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {alertSource.length === 0
                  ? "No low-stock or out-of-stock alerts at the moment."
                  : "Try adjusting the filter or search term."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 dark:border-gray-700 dark:bg-gray-700/60">
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
                        className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400 ${align}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-gray-700">
                  {visibleAlerts.map((item) => (
                    <tr
                      key={item.inventoryId}
                      className="transition-colors hover:bg-muted/30 dark:hover:bg-gray-700/40"
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4 font-medium text-foreground dark:text-gray-100">
                        {item.productName}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-sm text-muted-foreground dark:text-gray-400">
                        {item.category ?? "—"}
                      </td>

                      {/* Current Stock — red text if 0 */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-sm font-bold tabular-nums ${
                            item.stockQuantity === 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {item.stockQuantity}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-6 py-4 text-center text-sm tabular-nums text-muted-foreground dark:text-gray-400">
                        {item.reorderLevel}{item.unit ? ` ${item.unit}` : ""}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.stockStatus} />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handlePrepareOrder(item)}
                          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/20 transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:bg-amber-500 dark:hover:bg-amber-600 dark:focus:ring-offset-gray-800"
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
        </div>

        {/* Row count / source note */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground dark:text-gray-500">
            {isDummy
              ? "Showing sample data — live inventory not yet available."
              : `Showing ${visibleAlerts.length} of ${alertSource.length} alert${alertSource.length !== 1 ? "s" : ""} · Source: /api/inventory/low-stock`}
          </p>
        )}

      </div>
    </div>
  );
}
