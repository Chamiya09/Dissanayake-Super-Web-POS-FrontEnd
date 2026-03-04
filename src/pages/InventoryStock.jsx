import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import {
  Search,
  Package,
  Pencil,
  Trash2,
  Mouse,
  Keyboard,
  Cable,
  Monitor,
  Headphones,
  Utensils,
  Wifi,
  HardDrive,
  Box,
  AlertTriangle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  PackagePlus,
  ClipboardList,
  Hash,
  Loader2,
} from "lucide-react";

// ─── Category → icon mapping ──────────────────────────────────────────────────
const CATEGORY_ICON = {
  peripherals:  { icon: Mouse,      color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/40"  },
  accessories:  { icon: Cable,      color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/40"   },
  displays:     { icon: Monitor,    color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/40"     },
  audio:        { icon: Headphones, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40"},
  networking:   { icon: Wifi,       color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-950/40"     },
  storage:      { icon: HardDrive,  color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/40"     },
  food:         { icon: Utensils,   color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/40" },
  keyboards:    { icon: Keyboard,   color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
};

const getCategoryMeta = (category = "") => {
  const key = category.toLowerCase().trim();
  return (
    CATEGORY_ICON[key] ??
    Object.entries(CATEGORY_ICON).find(([k]) => key.includes(k))?.[1] ??
    { icon: Box, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" }
  );
};

// ─── Derive status from stock level ──────────────────────────────────────────
const deriveStatus = (qty, reorder) => {
  if (qty === 0)     return "Out of Stock";
  if (qty < reorder) return "Low Stock";
  return "In Stock";
};

// ─── Stock Form Empty State ──────────────────────────────────────────────────────
const EMPTY_STOCK_FORM = {
  productId: null,
  qtyToAdd: "",
  reason: "",
};

// ─── Reason presets ────────────────────────────────────────────────────────────
const REASON_PRESETS = ["New Shipment", "Return / Refund", "Stock Correction", "Supplier Restock", "Damaged Replacement"];

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

// ─── Add Inventory Stock Modal ──────────────────────────────────────────────────
const AddStockModal = ({ open, onClose, onSave, products }) => {
  const [form, setForm] = useState(EMPTY_STOCK_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // ── Searchable combobox state
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  if (!open) return null;

  const selectedProduct = products.find((p) => p.id === form.productId) ?? null;

  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectProduct = (p) => {
    setForm((prev) => ({ ...prev, productId: p.id }));
    setProductSearch("");
    setDropdownOpen(false);
    if (errors.productId) setErrors((e) => ({ ...e, productId: undefined }));
  };

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = (f) => {
    const e = {};
    if (!f.productId) e.productId = "Please select a product.";
    if (!f.qtyToAdd || isNaN(f.qtyToAdd) || !Number.isInteger(Number(f.qtyToAdd)) || Number(f.qtyToAdd) <= 0)
      e.qtyToAdd = "Enter a positive whole number.";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onSave({ ...form, qtyToAdd: Number(form.qtyToAdd) });
      setForm(EMPTY_STOCK_FORM);
      setProductSearch("");
      setErrors({});
      setSubmitted(false);
      onClose();
    }, 900);
  };

  const handleClose = () => {
    setForm(EMPTY_STOCK_FORM);
    setProductSearch("");
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  const inputBase =
    "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 " +
    "rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
    "outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 " +
    "focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-150";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-50">
              <PackagePlus size={17} className="text-white dark:text-slate-900" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight">
                Add Inventory Stock
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update stock level for an existing product
              </p>
            </div>
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
          <div className="px-6 py-5 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">

            {/* ── 1. Searchable Product Selector ─────────────────────── */}
            <Field label="Product" error={errors.productId}>
              <div ref={comboRef} className="relative">
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`
                    w-full flex items-center justify-between
                    bg-slate-50 dark:bg-slate-800
                    border rounded-xl px-3.5 py-2.5 text-sm
                    transition-all duration-150
                    ${errors.productId
                      ? "border-red-400 dark:border-red-600"
                      : "border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10"
                    }
                  `}
                >
                  {selectedProduct ? (
                    (() => {
                      const { icon: SelIcon, color: selColor } = getCategoryMeta(selectedProduct.category);
                      return (
                        <span className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                          <SelIcon size={14} className={selColor} strokeWidth={1.8} />
                          <span className="font-medium">{selectedProduct.productName}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-xs">{selectedProduct.sku}</span>
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Search and select a product…</span>
                  )}
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute z-10 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    {/* Search inside dropdown */}
                    <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          autoFocus
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Type to search…"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-400"
                        />
                      </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-48 overflow-y-auto py-1.5">
                      {filteredProducts.length === 0 ? (
                        <li className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                          No products found
                        </li>
                      ) : (
                        filteredProducts.map((p) => {
                          const { icon: PIcon, color: pColor, bg: pBg } = getCategoryMeta(p.category);
                          const qty = p.stockQuantity ?? 0;
                          return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => selectProduct(p)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                                hover:bg-slate-50 dark:hover:bg-slate-800
                                transition-colors duration-100
                                ${form.productId === p.id ? "bg-slate-50 dark:bg-slate-800 font-semibold" : ""}
                              `}
                            >
                              <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${pBg}`}>
                                <PIcon size={13} className={pColor} strokeWidth={1.8} />
                              </span>
                              <span className="flex flex-col leading-tight">
                                <span className="text-slate-800 dark:text-slate-100 font-medium">{p.productName}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{p.sku} &bull; {p.category}</span>
                              </span>
                              <span className={`ml-auto text-xs font-semibold ${
                                qty < 10 ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
                              }`}>
                                {qty} {p.unit ?? "units"}
                              </span>
                            </button>
                          </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Field>

            {/* ── 2. Current Stock (read-only) ─────────────────────── */}
            {selectedProduct && (
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Current Stock
                </span>
                <span className={`flex items-center gap-1.5 font-bold text-sm ${
                  (selectedProduct.stockQuantity ?? 0) < 10
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-700 dark:text-slate-200"
                }`}>
                  {(selectedProduct.stockQuantity ?? 0) < 10 && <AlertTriangle size={13} strokeWidth={2.2} />}
                  {selectedProduct.stockQuantity ?? 0} {selectedProduct.unit ?? "units"}
                </span>
              </div>
            )}

            {/* ── 3. Quantity to Add ───────────────────────────── */}
            <Field label="Quantity to Add" error={errors.qtyToAdd} icon={Hash}>
              <input
                type="number"
                min="1"
                step="1"
                value={form.qtyToAdd}
                onChange={set("qtyToAdd")}
                placeholder="e.g. 50"
                className={`${inputBase} pl-9 ${
                  errors.qtyToAdd ? "border-red-400 dark:border-red-600" : ""
                }`}
              />
            </Field>

            {/* Running total hint */}
            {selectedProduct && form.qtyToAdd && !isNaN(form.qtyToAdd) && Number(form.qtyToAdd) > 0 && (
              <div className="-mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={12} strokeWidth={2.2} />
                New total will be <span className="font-bold">{selectedProduct.quantity + Number(form.qtyToAdd)} units</span>
              </div>
            )}

            {/* ── 4. Reason / Note (optional) ────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Reason / Note
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Optional</span>
              </div>
              {/* Quick-pick presets */}
              <div className="flex flex-wrap gap-1.5 mb-1">
                {REASON_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, reason: r }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150 ${
                      form.reason === r
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-50"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="relative">
                <ClipboardList
                  size={14}
                  className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                />
                <textarea
                  value={form.reason}
                  onChange={set("reason")}
                  rows={2}
                  placeholder="e.g. New Shipment from Supplier A…"
                  className={`${inputBase} pl-9 resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
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
                  Stock Updated!
                </>
              ) : (
                <>
                  <PlusCircle size={15} strokeWidth={2} />
                  Add Stock
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
    dot:  "bg-emerald-500",
  },
  "Low Stock": {
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-800",
    dot:  "bg-amber-500",
  },
  "Out of Stock": {
    pill: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-800",
    dot:  "bg-red-500",
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch]     = useState("");
  const [sortKey, setSortKey]   = useState("productName");
  const [sortDir, setSortDir]   = useState("asc");
  const [modalOpen, setModalOpen] = useState(false);

  // ── Fetch products from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    api
      .get("/api/products")
      .then((res) => {
        if (!cancelled) {
          // Normalise: ensure numeric fields are JS numbers
          const normalised = res.data.map((p) => ({
            ...p,
            sellingPrice:  Number(p.sellingPrice),
            buyingPrice:   Number(p.buyingPrice),
            stockQuantity: p.stockQuantity  != null ? Number(p.stockQuantity)  : 0,
            reorderLevel:  p.reorderLevel   != null ? Number(p.reorderLevel)   : 10,
          }));
          setProducts(normalised);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError("Failed to load products. Please check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleAddStock = (formData) => {
    // TODO: wire to stock-update API — formData: { productId, qtyToAdd, reason }
    console.log("Stock update:", formData);
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

  // ── Filtered + Sorted Data (uses real backend field names)
  const filtered = products
    .filter(({ productName, category, sku }) => {
      const q = search.toLowerCase();
      return (
        productName.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      const cmp  = typeof valA === "string" ? valA.localeCompare(valB) : valA - valB;
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── Summary Stats
  const totalProducts  = products.length;
  const lowStockCount  = products.filter((p) => deriveStatus(p.stockQuantity, p.reorderLevel) !== "In Stock").length;
  const totalValue     = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* ── Scrollable page content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      <AddStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddStock}
        products={products}
      />

      {/* ── Error Banner ────────────────────────────────────────── */}
      {fetchError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-5 py-4 text-sm">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">Failed to load inventory</p>
            <p className="text-red-600 dark:text-red-500 text-xs mt-0.5">{fetchError}</p>
          </div>
        </div>
      )}

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
          <PlusCircle size={16} strokeWidth={2} />
          Add Inventory Stock
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">        {loading ? (
          /* Loading skeleton */
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 dark:text-slate-600">
            <Loader2 size={32} strokeWidth={1.5} className="animate-spin" />
            <p className="text-sm font-medium">Loading inventory…</p>
          </div>
        ) : (        <table className="w-full text-sm">

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
                const qty      = item.stockQuantity  ?? 0;
                const reorder  = item.reorderLevel   ?? 10;
                const status   = deriveStatus(qty, reorder);
                const isLow    = status !== "In Stock";
                const isWarning = qty < 10;
                const cfg      = STATUS_CONFIG[status] ?? STATUS_CONFIG["In Stock"];
                const { icon: Icon, color: iconColor, bg: iconBg } = getCategoryMeta(item.category);

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
                          className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${iconBg}`}
                        >
                          <Icon size={16} className={iconColor} strokeWidth={1.8} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">
                            {item.productName}
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
                      ${item.sellingPrice.toFixed(2)}
                    </td>

                    {/* Quantity (stockQuantity) */}
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
                            qty === 0
                              ? "text-red-600 dark:text-red-400"
                              : isWarning
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {qty}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {item.unit ?? "units"}
                        </span>
                      </div>
                    </td>

                    {/* Status (derived from stockQuantity vs reorderLevel) */}
                    <td className="py-6 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {status}
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
        )} {/* end loading ternary */}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {products.length}
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
