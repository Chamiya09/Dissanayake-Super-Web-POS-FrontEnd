import { useState, useCallback } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { AlertTriangle, PackageSearch, RefreshCw, ShoppingCart } from "lucide-react";
import { useInventory } from "@/context/InventoryContext";
import { formatCurrency } from "@/utils/formatCurrency";

/* ── Status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const styles = {
    LOW_STOCK:    "bg-amber-100  text-amber-700  border-amber-200  dark:bg-amber-900/20  dark:text-amber-400  dark:border-amber-800",
    OUT_OF_STOCK: "bg-red-100    text-red-700    border-red-200    dark:bg-red-900/20    dark:text-red-400    dark:border-red-800",
  };
  const labels = {
    LOW_STOCK:    "Low Stock",
    OUT_OF_STOCK: "Out of Stock",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

/* ── Summary card ─────────────────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function ReorderManagement() {
  const { inventoryItems, analyticsLoading, refreshInventory } = useInventory();

  /* Local filter: "all" | "LOW_STOCK" | "OUT_OF_STOCK" */
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const handleRefresh = useCallback(() => {
    refreshInventory();
  }, [refreshInventory]);

  /* Items that need attention (low or out-of-stock) */
  const alertItems = inventoryItems.filter(
    (item) => item.stockStatus === "LOW_STOCK" || item.stockStatus === "OUT_OF_STOCK"
  );

  const lowStockCount  = alertItems.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount = alertItems.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;

  /* Apply filter + search */
  const visibleItems = alertItems
    .filter((item) => filter === "all" || item.stockStatus === filter)
    .filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

  const FILTER_TABS = [
    { key: "all",          label: "All Alerts" },
    { key: "LOW_STOCK",    label: "Low Stock"   },
    { key: "OUT_OF_STOCK", label: "Out of Stock" },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* ── Page heading ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <PackageSearch className="h-6 w-6 text-amber-500" />
              Reorder &amp; Low Stock Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor inventory alerts and identify products that need to be reordered.
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={analyticsLoading}
            className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-amber-100 dark:bg-amber-900/20"
            iconColor="text-amber-600 dark:text-amber-400"
            label="Total Alerts"
            value={alertItems.length}
            sub="Products needing attention"
          />
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-orange-100 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
            label="Low Stock"
            value={lowStockCount}
            sub="Below reorder level"
          />
          <SummaryCard
            icon={ShoppingCart}
            iconBg="bg-red-100 dark:bg-red-900/20"
            iconColor="text-red-600 dark:text-red-400"
            label="Out of Stock"
            value={outOfStockCount}
            sub="Immediately requires reorder"
          />
        </div>

        {/* ── Filter tabs + search ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, SKU, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-72"
          />
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {analyticsLoading ? (
            /* Loading skeleton */
            <div className="flex flex-col divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">
                {alertItems.length === 0
                  ? "All products are well-stocked!"
                  : "No items match your search."}
              </p>
              <p className="text-sm text-muted-foreground">
                {alertItems.length === 0
                  ? "There are currently no low-stock or out-of-stock alerts."
                  : "Try adjusting your filter or search term."}
              </p>
            </div>
          ) : (
            /* Data table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Product</th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">SKU</th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Category</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Current Stock</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Reorder Level</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground">Selling Price</th>
                    <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleItems.map((item) => (
                    <tr
                      key={item.inventoryId}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4 font-medium text-foreground">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`font-semibold ${
                            item.stockStatus === "OUT_OF_STOCK"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {item.stockQuantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {item.reorderLevel}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.stockStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Row count */}
        {!analyticsLoading && visibleItems.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {visibleItems.length} of {alertItems.length} alert{alertItems.length !== 1 ? "s" : ""}
          </p>
        )}

      </div>
    </div>
  );
}
