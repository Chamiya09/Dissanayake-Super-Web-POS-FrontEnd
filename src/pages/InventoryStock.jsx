import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
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
  X,
  Tag,
  Hash,
  DollarSign,
  Layers,
  CheckCircle2,
  Sparkles,
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

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Peripherals",
  "Accessories",
  "Displays",
  "Audio",
  "Networking",
  "Storage",
  "Components",
  "Other",
];

// ─── Empty Form State ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  category: "",
  sku: "",
  costPrice: "",
  sellingPrice: "",
  quantity: "",
};

// ─── Field helper ─────────────────────────────────────────────────────────────
const Field = ({ label, error, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {label} <span className="text-red-500 normal-case tracking-normal">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      )}
      {children}
    </div>
    {error && (
      <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
        {error}
      </p>
    )}
  </div>
);

// ─── Add Product Modal ────────────────────────────────────────────────────────
const AddProductModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = "Product name is required.";
    if (!f.category) e.category = "Please select a category.";
    if (!f.sku.trim()) e.sku = "SKU is required.";
    if (!f.costPrice || isNaN(f.costPrice) || Number(f.costPrice) < 0)
      e.costPrice = "Enter a valid cost price.";
    if (!f.sellingPrice || isNaN(f.sellingPrice) || Number(f.sellingPrice) < 0)
      e.sellingPrice = "Enter a valid selling price.";
    if (!f.quantity || isNaN(f.quantity) || !Number.isInteger(Number(f.quantity)) || Number(f.quantity) < 0)
      e.quantity = "Enter a valid whole number quantity.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onSave(form);
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitted(false);
      onClose();
    }, 900);
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  const inputBase =
    "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 " +
    "rounded-lg py-2.5 pr-3 text-sm text-slate-800 dark:text-slate-100 " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
    "outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 " +
    "focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-150";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Soft blur backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              Add New Product
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the details below to add a product to inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">

            {/* Product Name */}
            <Field label="Product Name" error={errors.name} icon={Tag}>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Wireless Mouse"
                className={`${inputBase} pl-9`}
              />
            </Field>

            {/* Category */}
            <Field label="Category" error={errors.category} icon={Layers}>
              <select
                value={form.category}
                onChange={set("category")}
                className={`${inputBase} pl-9 appearance-none cursor-pointer`}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>

            {/* SKU */}
            <Field label="SKU" error={errors.sku} icon={Hash}>
              <input
                type="text"
                value={form.sku}
                onChange={set("sku")}
                placeholder="e.g. PRF-007"
                className={`${inputBase} pl-9`}
              />
            </Field>

            {/* Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cost Price" error={errors.costPrice} icon={DollarSign}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={set("costPrice")}
                  placeholder="0.00"
                  className={`${inputBase} pl-9`}
                />
              </Field>
              <Field label="Selling Price" error={errors.sellingPrice} icon={DollarSign}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={set("sellingPrice")}
                  placeholder="0.00"
                  className={`${inputBase} pl-9`}
                />
              </Field>
            </div>

            {/* Initial Quantity */}
            <Field label="Initial Quantity" error={errors.quantity} icon={Package}>
              <input
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="e.g. 50"
                className={`${inputBase} pl-9`}
              />
            </Field>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitted}
              className="
                inline-flex items-center gap-2
                px-5 py-2.5 rounded-xl text-sm font-medium
                bg-slate-900 dark:bg-slate-50
                text-white dark:text-slate-900
                hover:bg-slate-700 dark:hover:bg-slate-200
                active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              {submitted ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Saved!
                </>
              ) : (
                <>
                  <Plus size={15} strokeWidth={2.5} />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [modalOpen, setModalOpen] = useState(false);

  const handleSaveProduct = (formData) => {
    // TODO: wire to API — formData contains { name, category, sku, costPrice, sellingPrice, quantity }
    console.log("New product:", formData);
  };

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
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* ── Scrollable page content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto w-full bg-slate-50/50 dark:bg-slate-950 p-10">
      <AddProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
      />

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
          onClick={() => setModalOpen(true)}
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
                const isWarning = item.quantity < 10;
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG["In Stock"];

                return (
                  <tr
                    key={item.id}
                    className={`
                      border-b border-slate-100 dark:border-slate-800 last:border-0
                      hover:bg-slate-50/80 dark:hover:bg-slate-800/50
                      hover:shadow-[inset_3px_0_0_0] hover:shadow-slate-900/10 dark:hover:shadow-slate-50/5
                      transition-all duration-200
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
                          <p className="font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-6 px-6 text-slate-500 dark:text-slate-400 text-sm">
                      {item.category}
                    </td>

                    {/* Price */}
                    <td className="py-6 px-6 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      ${item.price.toFixed(2)}
                    </td>

                    {/* Quantity */}
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-1.5">
                        {isWarning && (
                          <span title="Low quantity warning">
                            <AlertTriangle
                              size={13}
                              strokeWidth={2.2}
                              className="text-amber-500 dark:text-amber-400 flex-shrink-0 animate-pulse"
                            />
                          </span>
                        )}
                        <span
                          className={`font-semibold tabular-nums ${
                            isWarning
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
                      <div className="flex items-center gap-1.5">
                        {/* AI Reorder — only for low-stock items */}
                        {isLow && (
                          <button
                            type="button"
                            title="Suggest AI reorder quantity"
                            className="
                              inline-flex items-center gap-1.5
                              px-3 py-1.5 rounded-lg text-xs font-semibold
                              bg-violet-50 text-violet-700
                              ring-1 ring-violet-200
                              dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-800
                              hover:bg-violet-100 dark:hover:bg-violet-950/60
                              transition-all duration-200
                              whitespace-nowrap
                            "
                          >
                            <Sparkles size={12} strokeWidth={2} />
                            Suggest Reorder
                          </button>
                        )}

                        <button
                          type="button"
                          title="Edit product"
                          className="
                            p-2 rounded-lg
                            text-slate-400
                            hover:text-blue-600 hover:bg-blue-50
                            dark:hover:text-blue-400 dark:hover:bg-blue-950/40
                            transition-all duration-150
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
                            transition-all duration-150
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
    </div>
  );
};

export default InventoryStock;
