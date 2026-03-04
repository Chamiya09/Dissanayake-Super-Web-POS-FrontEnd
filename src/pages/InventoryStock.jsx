import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import { showSuccess, showError } from "@/utils/toastUtils";
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

// ─── Add Inventory Stock Modal ───────────────────────────────────────────────
const AddStockModal = ({ open, onClose, products, onStockUpdated }) => {
  // ── Product selection
  const [selectedId,   setSelectedId]   = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef(null);

  // ── Live stock (fetched fresh when a product is picked)
  const [currentStock,  setCurrentStock]  = useState(null);   // null = not yet loaded
  const [fetchingStock, setFetchingStock] = useState(false);
  const selectedUnit = products.find((p) => p.id === selectedId)?.unit ?? "units";

  // ── Manual quantity input
  const [qtyToAdd, setQtyToAdd] = useState("");

  // ── Submission state
  const [submitting, setSubmitting] = useState(false);
  const [apiError,   setApiError]   = useState(null);
  const [success,    setSuccess]    = useState(false);

  // ── Validation errors
  const [errors, setErrors] = useState({});

  // ── Close combobox on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (comboRef.current && !comboRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // ── Fetch fresh stock whenever a product is selected
  useEffect(() => {
    if (!selectedId) { setCurrentStock(null); return; }
    setFetchingStock(true);
    setCurrentStock(null);
    api
      .get(`/api/products/${selectedId}`)
      .then((res) => setCurrentStock(Number(res.data.stockQuantity ?? 0)))
      .catch(() => {
        // Gracefully fallback to the value we already have in the list
        const found = products.find((p) => p.id === selectedId);
        setCurrentStock(found ? (found.stockQuantity ?? 0) : 0);
      })
      .finally(() => setFetchingStock(false));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  // ── Derived values
  const qtyNum    = parseInt(qtyToAdd, 10);
  const validQty  = !isNaN(qtyNum) && qtyNum > 0;
  const newTotal  = currentStock !== null && validQty ? currentStock + qtyNum : null;

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ── Handlers
  const selectProduct = (p) => {
    setSelectedId(p.id);
    setProductSearch("");
    setDropdownOpen(false);
    setErrors((e) => ({ ...e, product: undefined }));
  };

  const handleManualStockUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selectedId)  errs.product = "Please select a product.";
    if (!validQty)    errs.qty     = "Enter a positive whole number.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError(null);
    try {
      await api.put(`/api/inventory/add-stock/${selectedId}`, { quantity: qtyNum });
      showSuccess("Stock updated successfully!");
      setSuccess(true);
      setTimeout(() => {
        onStockUpdated?.();   // Refresh the table
        handleClose();
      }, 1200);
    } catch (err) {
      const msg = err.response?.data?.message ?? "Something went wrong. Please try again.";
      setApiError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setProductSearch("");
    setDropdownOpen(false);
    setCurrentStock(null);
    setQtyToAdd("");
    setErrors({});
    setApiError(null);
    setSuccess(false);
    onClose();
  };

  const inputBase =
    "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 " +
    "rounded-xl py-2.5 px-3.5 text-sm text-slate-800 dark:text-slate-100 " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
    "outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 " +
    "focus:border-slate-400 dark:focus:border-slate-500 transition-all duration-150";

  const selectedMeta  = selectedId ? getCategoryMeta(products.find((p) => p.id === selectedId)?.category ?? "") : null;
  const SelectedIcon  = selectedMeta?.icon;
  const selectedProductObj = products.find((p) => p.id === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

        {/* ── Modal Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-50 flex-shrink-0">
              <PackagePlus size={18} className="text-white dark:text-slate-900" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight">
                Add Inventory Stock
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select a product, enter quantity to add, and confirm.
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

        {/* ── Form ────────────────────────────────────────────── */}
        <form onSubmit={handleManualStockUpdate} noValidate>
          <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

            {/* API error banner */}
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm">
                <AlertCircle size={15} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-red-700 dark:text-red-400">{apiError}</p>
              </div>
            )}

            {/* ── Step 1 · Product ─────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Product <span className="text-red-500 normal-case tracking-normal">*</span>
              </label>

              <div ref={comboRef} className="relative">
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`
                    w-full flex items-center justify-between gap-2
                    bg-slate-50 dark:bg-slate-800
                    border rounded-xl px-4 py-3 text-sm
                    transition-all duration-150
                    ${errors.product
                      ? "border-red-400 dark:border-red-600 ring-1 ring-red-400/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }
                  `}
                >
                  {selectedProductObj ? (
                    <span className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 min-w-0">
                      {SelectedIcon && (
                        <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${selectedMeta.bg}`}>
                          <SelectedIcon size={13} className={selectedMeta.color} strokeWidth={1.8} />
                        </span>
                      )}
                      <span className="font-semibold truncate">{selectedProductObj.productName}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs flex-shrink-0">{selectedProductObj.sku}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Search size={13} />
                      Search and select a product…
                    </span>
                  )}
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute z-20 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search bar inside dropdown */}
                    <div className="px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          autoFocus
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Type name or SKU…"
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <ul className="max-h-52 overflow-y-auto py-1.5">
                      {filteredProducts.length === 0 ? (
                        <li className="px-4 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                          No products match your search
                        </li>
                      ) : (
                        filteredProducts.map((p) => {
                          const { icon: PIcon, color: pColor, bg: pBg } = getCategoryMeta(p.category);
                          const pQty = p.stockQuantity ?? 0;
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => selectProduct(p)}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                                  hover:bg-slate-50 dark:hover:bg-slate-800
                                  transition-colors duration-100
                                  ${selectedId === p.id ? "bg-slate-50 dark:bg-slate-800" : ""}
                                `}
                              >
                                <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${pBg}`}>
                                  <PIcon size={14} className={pColor} strokeWidth={1.8} />
                                </span>
                                <span className="flex flex-col leading-snug min-w-0">
                                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                    {p.productName}
                                  </span>
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {p.sku} &bull; {p.category}
                                  </span>
                                </span>
                                <span className={`ml-auto flex-shrink-0 text-xs font-semibold ${
                                  pQty === 0
                                    ? "text-red-500 dark:text-red-400"
                                    : pQty < 10
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-slate-500 dark:text-slate-400"
                                }`}>
                                  {pQty} {p.unit ?? "units"}
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

              {errors.product && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.product}
                </p>
              )}
            </div>

            {/* ── Step 2 · Current Stock (read-only) ────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Current Stock
              </label>
              <div className={`
                flex items-center justify-between
                rounded-xl border px-4 py-3
                bg-slate-50 dark:bg-slate-800/60
                border-slate-200 dark:border-slate-700
                ${!selectedId ? "opacity-50" : ""}
              `}>
                {!selectedId ? (
                  <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                    — select a product first —
                  </span>
                ) : fetchingStock ? (
                  <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Loader2 size={14} className="animate-spin" />
                    Fetching latest stock…
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    {(currentStock ?? 0) < 10 && (
                      <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" strokeWidth={2.2} />
                    )}
                    {currentStock ?? 0}
                    <span className="font-normal text-slate-400 dark:text-slate-500 text-xs">{selectedUnit}</span>
                  </span>
                )}
                <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                  read-only
                </span>
              </div>
            </div>

            {/* ── Step 3 · Quantity to Add ───────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Quantity to Add <span className="text-red-500 normal-case tracking-normal">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={qtyToAdd}
                  onChange={(e) => {
                    setQtyToAdd(e.target.value);
                    if (errors.qty) setErrors((x) => ({ ...x, qty: undefined }));
                  }}
                  placeholder="e.g. 50"
                  className={`${inputBase} pl-9 ${
                    errors.qty ? "border-red-400 dark:border-red-600 ring-1 ring-red-400/30" : ""
                  }`}
                />
              </div>
              {errors.qty && (
                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
                  {errors.qty}
                </p>
              )}
            </div>

            {/* ── Step 4 · New Total Preview ─────────────────────── */}
            <div className={`
              rounded-xl border px-4 py-4
              transition-all duration-300
              ${newTotal !== null
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-50"
              }
            `}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                New Total Preview
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Current */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {currentStock ?? "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Current</span>
                </div>

                {/* Plus sign */}
                <span className="text-xl font-light text-slate-400 dark:text-slate-500 pb-3">+</span>

                {/* Qty to add */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold tabular-nums text-slate-700 dark:text-slate-300">
                    {validQty ? qtyNum : "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Adding</span>
                </div>

                {/* Equals sign */}
                <span className="text-xl font-light text-slate-400 dark:text-slate-500 pb-3">=</span>

                {/* New total */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-2xl font-bold tabular-nums ${
                    newTotal !== null
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {newTotal ?? "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">New Total</span>
                </div>

                {newTotal !== null && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 size={12} strokeWidth={2.2} />
                    {selectedUnit}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
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
              disabled={submitting || success || fetchingStock}
              className="
                inline-flex items-center gap-2
                px-6 py-2.5 rounded-xl text-sm font-semibold
                bg-slate-900 dark:bg-slate-50
                text-white dark:text-slate-900
                hover:bg-slate-700 dark:hover:bg-slate-200
                active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150
              "
            >
              {success ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  Stock Updated!
                </>
              ) : submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <PlusCircle size={15} strokeWidth={2} />
                  Confirm Stock Update
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
  // products   = all products (dropdown list for AddStockModal)
  // inventoryItems = only tracked items from /api/inventory/status (table)
  const [products,       setProducts]       = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [fetchError,     setFetchError]     = useState(null);
  const [search,         setSearch]         = useState("");
  const [sortKey,        setSortKey]        = useState("productName");
  const [sortDir,        setSortDir]        = useState("asc");
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);   // inventory item to edit
  const [deleteTarget,   setDeleteTarget]   = useState(null);   // inventory item to delete
  const [deleting,       setDeleting]       = useState(false);

  // ── Fetch all products (for AddStockModal dropdown)
  const fetchProducts = () =>
    api.get("/api/products").then((res) => {
      setProducts(
        res.data.map((p) => ({
          ...p,
          sellingPrice:  Number(p.sellingPrice),
          buyingPrice:   Number(p.buyingPrice),
          stockQuantity: p.stockQuantity != null ? Number(p.stockQuantity) : 0,
          reorderLevel:  p.reorderLevel  != null ? Number(p.reorderLevel)  : 10,
        }))
      );
    });

  // ── Fetch tracked inventory items (for the table)
  const fetchInventory = () =>
    api.get("/api/inventory/status").then((res) => {
      setInventoryItems(
        res.data.map((item) => ({
          ...item,
          sellingPrice:  Number(item.sellingPrice  ?? 0),
          stockQuantity: Number(item.stockQuantity ?? 0),
          reorderLevel:  Number(item.reorderLevel  ?? 10),
        }))
      );
    });

  // ── Refresh both (used after any mutation)
  const refreshAll = () => {
    setLoading(true);
    setFetchError(null);
    Promise.all([fetchProducts(), fetchInventory()])
      .catch(() => setFetchError("Failed to load inventory. Please check your connection and try again."))
      .finally(() => setLoading(false));
  };

  // ── Initial load
  useEffect(() => { refreshAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete inventory record (stops tracking; does NOT delete the product)
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/inventory/${deleteTarget.inventoryId}`);
      showSuccess(`Stopped tracking "${deleteTarget.productName}".`);
      setDeleteTarget(null);
      refreshAll();
    } catch (err) {
      showError(err.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
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

  // ── Filtered + Sorted Data (from /api/inventory/status → inventoryItems only)
  const filtered = inventoryItems
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

  // ── Summary Stats (based on tracked inventory items)
  const totalProducts  = inventoryItems.length;
  const lowStockCount  = inventoryItems.filter((p) => deriveStatus(p.stockQuantity, p.reorderLevel) !== "In Stock").length;
  const totalValue     = inventoryItems.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* ── Scrollable page content ─────────────────────────────── */}

      {/* ── Full-page loading state ────────────────────────── */}
      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {/* Layered ring spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900 dark:border-t-slate-100 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Loading Inventory
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Fetching your product stock levels…
            </p>
          </div>
        </div>
      )}

      {/* ── Full-page error state ───────────────────────────── */}
      {!loading && fetchError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          {/* Icon illustration */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <AlertCircle size={36} strokeWidth={1.5} className="text-red-400 dark:text-red-500" />
          </div>
          {/* Message */}
          <div className="text-center max-w-sm">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Error Loading Data
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {fetchError}
            </p>
          </div>
          {/* Retry button */}
          <button
            type="button"
            onClick={fetchProducts}
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl text-sm font-semibold
              bg-slate-900 dark:bg-slate-50
              text-white dark:text-slate-900
              hover:bg-slate-700 dark:hover:bg-slate-200
              active:scale-95 transition-all duration-150
              shadow-sm
            "
          >
            <svg
              className="w-4 h-4"
              fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Retry
          </button>
        </div>
      )}

      {/* ── Main content (only when loaded successfully) ──────────── */}
      {!loading && !fetchError && (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
      <AddStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={products}
        onStockUpdated={refreshAll}
      />
      <EditInventoryModal
        open={!!editTarget}
        item={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={refreshAll}
      />
      {/* ── Delete Confirm Dialog ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40">
                <Trash2 size={18} className="text-red-500" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">Remove from Tracking</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This will NOT delete the product.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Stop tracking inventory for{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-50">{deleteTarget.productName}</span>?{" "}
              The product will remain in your catalogue.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-95 disabled:opacity-60 transition-all"
              >
                {deleting
                  ? <><Loader2 size={14} className="animate-spin" />Removing…</>
                  : <><Trash2 size={14} />Remove</>}
              </button>
            </div>
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
                const qty      = item.stockQuantity  ?? 0;
                const reorder  = item.reorderLevel   ?? 10;
                const status   = deriveStatus(qty, reorder);
                const isLow    = status !== "In Stock";
                const isWarning = qty < 10;
                const cfg      = STATUS_CONFIG[status] ?? STATUS_CONFIG["In Stock"];
                const { icon: Icon, color: iconColor, bg: iconBg } = getCategoryMeta(item.category);

                return (
                  <tr
                    key={item.inventoryId}
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
                          title="Edit inventory settings"
                          onClick={() => setEditTarget(item)}
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
                          title="Remove from inventory tracking"
                          onClick={() => setDeleteTarget(item)}
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
              {inventoryItems.length}
            </span>{" "}
            tracked items
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
      )}
    </div>
  );
};

export default InventoryStock;
