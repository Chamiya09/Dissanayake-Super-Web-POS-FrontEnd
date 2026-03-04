import { useState } from "react";
import {
  Search,
  Plus,
  Package,
  Pencil,
  Trash2,
  Mouse,
  Keyboard,
  Cable,
  Monitor,
  Headphones,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Wireless Mouse",
    category: "Peripherals",
    price: 29.99,
    quantity: 142,
    status: "In Stock",
    sku: "PRF-001",
    icon: Mouse,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    id: 2,
    name: "Mechanical Keyboard",
    category: "Peripherals",
    price: 89.99,
    quantity: 38,
    status: "In Stock",
    sku: "PRF-002",
    icon: Keyboard,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    id: 3,
    name: "USB-C Hub 7-in-1",
    category: "Accessories",
    price: 49.99,
    quantity: 7,
    status: "Low Stock",
    sku: "ACC-003",
    icon: Cable,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    id: 4,
    name: '27" IPS Monitor',
    category: "Displays",
    price: 319.99,
    quantity: 5,
    status: "Low Stock",
    sku: "DSP-004",
    icon: Monitor,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    id: 5,
    name: "Noise Cancelling Headset",
    category: "Audio",
    price: 129.99,
    quantity: 55,
    status: "In Stock",
    sku: "AUD-005",
    icon: Headphones,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    id: 6,
    name: "Ergonomic Laptop Stand",
    category: "Accessories",
    price: 39.99,
    quantity: 89,
    status: "In Stock",
    sku: "ACC-006",
    icon: Package,
    iconColor: "text-cyan-500",
    iconBg: "bg-cyan-50 dark:bg-cyan-950/40",
  },
];

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "In Stock": {
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800",
    dot: "bg-emerald-500",
  },
  "Low Stock": {
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
    dot: "bg-amber-500",
  },
};

// ─── Column Definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: "name", label: "Product Name", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "price", label: "Price", sortable: true },
  { key: "quantity", label: "Quantity", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "actions", label: "Actions", sortable: false },
];

// ─── Component ────────────────────────────────────────────────────────────────
const InventoryStock = () => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  // ── Sorting
  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ── Filtered + Sorted Data
  const filtered = MOCK_PRODUCTS.filter(({ name, category, sku, status }) => {
    const q = search.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      category.toLowerCase().includes(q) ||
      sku.toLowerCase().includes(q) ||
      status.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    const cmp =
      typeof valA === "string"
        ? valA.localeCompare(valB)
        : valA - valB;
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ── Summary Stats
  const totalProducts = MOCK_PRODUCTS.length;
  const lowStockCount = MOCK_PRODUCTS.filter((p) => p.status === "Low Stock").length;
  const totalValue = MOCK_PRODUCTS.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-950 min-h-screen p-10">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Inventory Stock
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor stock levels and manage your product catalogue
          </p>
        </div>

        <button
          type="button"
          className="
            inline-flex items-center gap-2 self-start sm:self-auto
            bg-slate-900 dark:bg-slate-50
            text-white dark:text-slate-900
            text-sm font-medium
            px-5 py-3 rounded-xl
            shadow-sm
            hover:bg-slate-700 dark:hover:bg-slate-200
            active:scale-95
            transition-all duration-200
            whitespace-nowrap
          "
        >
          <Plus size={16} strokeWidth={2.5} />
          Add New Product
        </button>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Total Products",
            value: totalProducts,
            sub: "items in catalogue",
            color: "text-slate-900 dark:text-slate-50",
          },
          {
            label: "Low Stock Alerts",
            value: lowStockCount,
            sub: "items need restocking",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Inventory Value",
            value: `$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            sub: "total stock value",
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-6 py-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
              {label}
            </p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="relative w-full sm:w-1/2 mb-6">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, category or status…"
          className="
            w-full bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-xl shadow-sm
            pl-9 pr-4 py-2.5
            text-sm text-slate-700 dark:text-slate-200
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            outline-none
            focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10
            focus:border-slate-300 dark:focus:border-slate-600
            transition-all duration-200
          "
        />
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-sm">

          {/* Head */}
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
              {COLUMNS.map(({ key, label, sortable }) => (
                <th
                  key={key}
                  onClick={() => sortable && handleSort(key)}
                  className={`
                    py-4 px-6 text-left text-xs font-bold uppercase tracking-widest
                    text-slate-500 dark:text-slate-400 whitespace-nowrap
                    ${sortable ? "cursor-pointer select-none hover:text-slate-800 dark:hover:text-slate-200 transition-colors" : ""}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortable && sortKey === key && (
                      sortDir === "asc"
                        ? <ChevronUp size={12} strokeWidth={2.5} />
                        : <ChevronDown size={12} strokeWidth={2.5} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                    <Package size={36} strokeWidth={1.2} />
                    <p className="text-sm font-medium">No products match your search</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => {
                const Icon = item.icon;
                const isLow = item.status === "Low Stock";
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG["In Stock"];

                return (
                  <tr
                    key={item.id}
                    className={`
                      border-b border-slate-100 dark:border-slate-800 last:border-0
                      hover:bg-slate-50/60 dark:hover:bg-slate-800/40
                      transition-colors duration-150
                      ${idx % 2 !== 0 ? "bg-slate-50/30 dark:bg-slate-800/[0.15]" : ""}
                    `}
                  >
                    {/* Product Name */}
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${item.iconBg}`}
                        >
                          <Icon size={16} className={item.iconColor} strokeWidth={1.8} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-6 px-6 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>

                    {/* Price */}
                    <td className="py-6 px-6 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      ${item.price.toFixed(2)}
                    </td>

                    {/* Quantity */}
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-1.5">
                        {isLow && (
                          <AlertTriangle
                            size={13}
                            strokeWidth={2.2}
                            className="text-amber-500 dark:text-amber-400 flex-shrink-0"
                          />
                        )}
                        <span
                          className={`font-semibold tabular-nums ${
                            isLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.quantity}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          units
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-6 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Edit product"
                          className="
                            p-2 rounded-lg
                            text-slate-400
                            hover:text-blue-600 hover:bg-blue-50
                            dark:hover:text-blue-400 dark:hover:bg-blue-950/40
                            transition-colors duration-150
                          "
                        >
                          <Pencil size={15} strokeWidth={1.8} />
                        </button>
                        <button
                          type="button"
                          title="Delete product"
                          className="
                            p-2 rounded-lg
                            text-slate-400
                            hover:text-red-600 hover:bg-red-50
                            dark:hover:text-red-400 dark:hover:bg-red-950/40
                            transition-colors duration-150
                          "
                        >
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {MOCK_PRODUCTS.length}
            </span>{" "}
            products
          </p>
          {lowStockCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle size={12} strokeWidth={2.2} />
              {lowStockCount} item{lowStockCount > 1 ? "s" : ""} need restocking
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryStock;
