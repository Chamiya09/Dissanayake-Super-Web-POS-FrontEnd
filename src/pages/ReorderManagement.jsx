import { useState, useCallback } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { AlertTriangle, PackageSearch, RefreshCw, DollarSign } from "lucide-react";
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

/* ── Analytics summary card ───────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub, trend }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
          {label}
        </p>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>

      {/* Value */}
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground dark:text-white">
        {value}
      </p>

      {/* Sub-label / trend */}
      {sub && (
        <p className="mt-1.5 text-xs text-muted-foreground dark:text-gray-400">{sub}</p>
      )}
      {trend && (
        <p className="mt-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">{trend}</p>
      )}
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

  const lowStockCount   = alertItems.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount  = alertItems.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;

  /* Estimated reorder value: sum of (reorderLevel - currentStock) × sellingPrice
     for every item currently below its reorder level.                           */
  const totalReorderValue = alertItems.reduce((sum, item) => {
    const deficit = Math.max(0, item.reorderLevel - item.stockQuantity);
    return sum + deficit * item.sellingPrice;
  }, 0);

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

        {/* ── Analytics summary cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 — Total Low Stock Items */}
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            label="Total Low Stock Items"
            value={analyticsLoading ? "—" : lowStockCount}
            sub="Products below reorder level"
          />

          {/* Card 2 — Out of Stock */}
          <SummaryCard
            icon={PackageSearch}
            iconBg="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            label="Out of Stock"
            value={analyticsLoading ? "—" : outOfStockCount}
            sub="Requires immediate reorder"
          />
          {/* Card 3 — Total Reorder Value */}
          <SummaryCard
            icon={DollarSign}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
            label="Total Reorder Value"
            value={analyticsLoading ? "—" : formatCurrency(totalReorderValue)}
            sub="Estimated cost to restock alerts"
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
