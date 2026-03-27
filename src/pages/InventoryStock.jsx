import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import { useToast } from "@/context/GlobalToastContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useInventory } from "@/context/InventoryContext";
import { InventoryAnalyticsCards } from "@/components/Inventory/InventoryAnalyticsCards";
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
  SlidersHorizontal,
} from "lucide-react";

// ─── Category → icon mapping ──────────────────────────────────────────────────
const CATEGORY_ICON = {
  peripherals:  { icon: Mouse,      color: "text-violet-500",  bg: "bg-violet-50"  },
  accessories:  { icon: Cable,      color: "text-amber-500",   bg: "bg-amber-50"   },
  displays:     { icon: Monitor,    color: "text-rose-500",    bg: "bg-rose-50"     },
  audio:        { icon: Headphones, color: "text-emerald-500", bg: "bg-emerald-50"},
  networking:   { icon: Wifi,       color: "text-cyan-500",    bg: "bg-cyan-50"     },
  storage:      { icon: HardDrive,  color: "text-blue-500",    bg: "bg-blue-50"     },
  food:         { icon: Utensils,   color: "text-orange-500",  bg: "bg-orange-50" },
  keyboards:    { icon: Keyboard,   color: "text-indigo-500",  bg: "bg-indigo-50" },
};

const getCategoryMeta = (category = "") => {
  const key = category.toLowerCase().trim();
  return (
    CATEGORY_ICON[key] ??
    Object.entries(CATEGORY_ICON).find(([k]) => key.includes(k))?.[1] ??
    { icon: Box, color: "text-slate-500", bg: "bg-slate-100" }
  );
};

// ─── Derive status from stock level ──────────────────────────────────────────
const deriveStatus = (qty, reorder) => {
  if (qty === 0)      return "Out of Stock";
  if (qty <= reorder) return "Low Stock";
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
    <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      {label} <span className="text-red-500 normal-case tracking-normal">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
        />
      )}
      {children}
    </div>
    {error && (
      <p className="text-[12px] text-red-500 flex items-center gap-1.5 mt-0.5">
        <span className="h-1 w-1 rounded-full bg-red-500 inline-block" />
        {error}
      </p>
    )}
  </div>
);

// ─── Add Inventory Stock Modal ───────────────────────────────────────────────
const AddStockModal = ({ open, onClose, products, inventoryItems = [], onStockUpdated }) => {
  const { showToast } = useToast();
  // ── Product selection
  const [selectedId,   setSelectedId]   = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef(null);

  // ── Current stock resolved from inventoryItems (no extra API call needed)
  const [currentStock, setCurrentStock] = useState(null);
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

  // ── Resolve current stock from inventoryItems when a product is selected
  useEffect(() => {
    if (!selectedId) { setCurrentStock(null); return; }
    const tracked = inventoryItems.find((item) => item.productId === selectedId);
    setCurrentStock(tracked ? Number(tracked.stockQuantity ?? 0) : 0);
  }, [selectedId, inventoryItems]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  // ── Derived values (parseFloat so decimal quantities like 1.5 kg are supported)
  const qtyNum    = parseFloat(qtyToAdd);
  const validQty  = !isNaN(qtyNum) && qtyNum !== 0;
  const newTotal  = currentStock !== null && validQty ? currentStock + qtyNum : null;
  const belowZero = newTotal !== null && newTotal < 0;

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
    if (!validQty)    errs.qty     = "Enter a non-zero quantity (positive to add, negative to remove).";
    if (belowZero)    errs.qty     = "Stock cannot be less than zero.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setApiError(null);
    try {
      await api.put(`/api/inventory/add-stock/${selectedId}`, { quantity: qtyNum });
      handleClose();
        onStockUpdated?.();
        showToast("Stock updated successfully!", "success");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Something went wrong. Please try again.";
      setApiError(msg);
        showToast(msg, "error");
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
    "w-full bg-white border border-slate-200 " +
    "rounded-xl h-10 px-3.5 text-[13px] text-slate-900 " +
    "placeholder:text-slate-400 " +
    "outline-none focus:ring-2 focus:ring-teal-600/20 " +
    "focus:border-teal-600 transition-all duration-150";

  const selectedMeta  = selectedId ? getCategoryMeta(products.find((p) => p.id === selectedId)?.category ?? "") : null;
  const SelectedIcon  = selectedMeta?.icon;
  const selectedProductObj = products.find((p) => p.id === selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

        {/* ── Modal Header ────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 flex-shrink-0">
              <PackagePlus className="h-5 w-5 text-teal-600" />
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                Add Inventory Stock
              </h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Enter a positive value to add stock, or negative to correct a mistake.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────────── */}
        <form onSubmit={handleManualStockUpdate} noValidate>
          <div className="px-6 py-5 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">

            {/* API error banner */}
            {apiError && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px]">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{apiError}</p>
              </div>
            )}

            {/* ── Step 1 · Product ─────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Product <span className="text-red-500 normal-case tracking-normal">*</span>
              </label>

              <div ref={comboRef} className="relative">
                {/* Trigger button */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`
                    w-full flex items-center justify-between gap-2
                    bg-white h-11
                    border rounded-xl px-4 text-[13px]
                    transition-all duration-150
                    ${errors.product
                      ? "border-red-400 ring-2 ring-red-100"
                      : "border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                    }
                  `}
                >
                  {selectedProductObj ? (
                    <span className="flex items-center gap-2.5 text-slate-900 min-w-0">
                      {SelectedIcon && (
                        <span className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-md ${selectedMeta.bg}`}>
                          <SelectedIcon className={`h-3.5 w-3.5 ${selectedMeta.color}`} />
                        </span>
                      )}
                      <span className="font-semibold truncate">{selectedProductObj.productName}</span>
                      <span className="text-slate-400 text-[12px] flex-shrink-0">{selectedProductObj.sku}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-slate-400">
                      <Search className="h-4 w-4" />
                      Search and select a product…
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {/* Search bar inside dropdown */}
                    <div className="px-3 pt-3 pb-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          autoFocus
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Type name or SKU…"
                          className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-[13px] text-slate-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                        />
                      </div>
                    </div>

                    {/* Options */}
                    <ul className="max-h-52 overflow-y-auto py-1.5">
                      {filteredProducts.length === 0 ? (
                        <li className="px-4 py-4 text-[13px] text-slate-500 text-center">
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
                                  w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left
                                  hover:bg-slate-50
                                  transition-colors duration-100
                                  ${selectedId === p.id ? "bg-slate-50" : ""}
                                `}
                              >
                                <span className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg ${pBg}`}>
                                  <PIcon className={`h-4 w-4 ${pColor}`} />
                                </span>
                                <span className="flex flex-col leading-snug min-w-0">
                                  <span className="font-semibold text-slate-900 truncate">
                                    {p.productName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 mt-0.5">
                                    {p.sku} &bull; {p.category}
                                  </span>
                                </span>
                                <span className={`ml-auto flex-shrink-0 text-[12px] font-semibold ${
                                  pQty === 0
                                    ? "text-red-600"
                                    : pQty < 10
                                    ? "text-amber-600"
                                    : "text-slate-500"
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
                <p className="text-[12px] text-red-500 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1 w-1 rounded-full bg-red-500 inline-block" />
                  {errors.product}
                </p>
              )}
            </div>

            {/* ── Step 2 · Current Stock (read-only) ────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Current Stock
              </label>
              <div className={`
                flex items-center justify-between
                rounded-xl border px-4 py-2.5 h-10
                bg-slate-50
                border-slate-200
                ${!selectedId ? "opacity-50" : ""}
              `}>
                {!selectedId ? (
                  <span className="text-[13px] text-slate-400 italic">
                    — select a product first —
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold text-slate-900 flex items-center gap-1.5">
                    {(currentStock ?? 0) < 10 && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {currentStock ?? 0}
                    <span className="font-normal text-slate-500 text-[12px]">{selectedUnit}</span>
                  </span>
                )}
                <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">
                  read-only
                </span>
              </div>
            </div>

            {/* ── Step 3 · Quantity to Add ───────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Quantity to Adjust <span className="text-red-500 normal-case tracking-normal">*</span>
              </label>
              <div className="relative">
                <Hash
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                />
                <input
                  type="number"
                  step="any"
                  value={qtyToAdd}
                  onChange={(e) => {
                    setQtyToAdd(e.target.value);
                    if (errors.qty) setErrors((x) => ({ ...x, qty: undefined }));
                  }}
                  placeholder="e.g. 50 or -5"
                  className={`${inputBase} pl-9 ${
                    errors.qty ? "border-red-400 ring-2 ring-red-100" : ""
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Use a negative number (e.g.&nbsp;<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">-5</code>) to reduce stock.
              </p>
              {errors.qty && (
                <p className="text-[12px] text-red-500 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1 w-1 rounded-full bg-red-500 inline-block" />
                  {errors.qty}
                </p>
              )}
            </div>

            {/* ── Step 4 · New Total Preview ─────────────────────── */}
            {(() => {
              // Determine colour theme based on result
              const theme = belowZero
                ? { card: "bg-red-50 border-red-200",
                    total: "text-red-700",
                    badge: "text-red-700 bg-red-100/50" }
                : validQty && qtyNum < 0
                ? { card: "bg-amber-50 border-amber-200",
                    total: "text-amber-700",
                    badge: "text-amber-700 bg-amber-100/50" }
                : newTotal !== null
                ? { card: "bg-emerald-50 border-emerald-200",
                    total: "text-emerald-700",
                    badge: "text-emerald-700 bg-emerald-100/50" }
                : { card: "bg-slate-50 border-slate-200 opacity-50",
                    total: "text-slate-400",
                    badge: "" };

              return (
                <div className={`rounded-xl border px-4 py-4 transition-all duration-300 ${theme.card}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
                    New Total Preview
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* Current */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl font-bold tabular-nums text-slate-800">
                        {currentStock ?? "—"}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">Current</span>
                    </div>

                    {/* Operator */}
                    <span className="text-xl font-light text-slate-400 pb-3">
                      {validQty && qtyNum < 0 ? "−" : "+"}
                    </span>

                    {/* Quantity */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-2xl font-bold tabular-nums ${
                        validQty && qtyNum < 0
                          ? "text-red-600"
                          : "text-slate-800"
                      }`}>
                        {validQty ? Math.abs(qtyNum) : "—"}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">
                        {validQty && qtyNum < 0 ? "Removing" : "Adding"}
                      </span>
                    </div>

                    {/* Equals */}
                    <span className="text-xl font-light text-slate-400 pb-3">=</span>

                    {/* New total */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-2xl font-bold tabular-nums ${theme.total}`}>
                        {newTotal ?? "—"}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-slate-500">New Total</span>
                    </div>

                    {/* Trailing badge */}
                    {newTotal !== null && (
                      <span className={`ml-auto flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg ${theme.badge}`}>
                        {belowZero
                          ? <><AlertTriangle className="h-4 w-4" strokeWidth={2.2} /> Below zero!</>
                          : <><CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2.5} /> {selectedUnit}</>
                        }
                      </span>
                    )}
                  </div>

                  {/* Inline error under preview */}
                  {belowZero && (
                    <p className="mt-3 text-[12px] text-red-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-4 w-4" strokeWidth={2} />
                      Stock cannot be less than zero.
                    </p>
                  )}
                </div>
              );
            })()}


          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center h-10 px-5 rounded-xl text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-slate-200 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="
                inline-flex items-center gap-2
                px-6 h-10 rounded-xl text-[13px] font-semibold shadow-sm
                bg-teal-600 text-white
                hover:bg-teal-700 focus:ring-2 focus:ring-teal-600 focus:ring-offset-2
                active:scale-95 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
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

// ─── Edit Inventory Modal ─────────────────────────────────────────────────────
const EditInventoryModal = ({ item, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [reorderLevel, setReorderLevel] = useState("");
  const [unit, setUnit] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setReorderLevel(item.reorderLevel ?? 10);
      setUnit(item.unit ?? "");
      setAdjustAmount("");
      setAdjustNotes("");
      setErrors({});
    }
  }, [item]);

  if (!item) return null;

  const currentQty = Number(item.stockQuantity ?? 0);
  const selectedUnit = item.unit || "units";
  const parsedAdjust = parseFloat(adjustAmount);
  const hasAdjustment = !isNaN(parsedAdjust) && parsedAdjust !== 0;
  const adjustResultQty = hasAdjustment ? currentQty + parsedAdjust : null;
  const isNegativeResult = adjustResultQty !== null && adjustResultQty < 0;
  const rlChanged = Number(reorderLevel) !== Number(item.reorderLevel ?? 10);
  const unitChanged = (unit.trim() || null) !== (item.unit || null);
  const settingsChanged = rlChanged || unitChanged;

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 placeholder:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all duration-150 border-slate-200";
  const errorCls = "border-red-400 ring-1 ring-red-400/30";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (hasAdjustment && isNegativeResult)
      errs.amount = `Cannot reduce by more than current stock (${currentQty}).`;
    if (hasAdjustment && !adjustNotes.trim())
      errs.notes = "Please provide a reason for this adjustment.";
    if (reorderLevel === "" || Number(reorderLevel) < 0)
      errs.reorderLevel = "Reorder level must be 0 or greater.";
    if (!hasAdjustment && !settingsChanged)
      errs.general = "Make a stock adjustment or change settings to update.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (hasAdjustment) {
        await api.post(`/api/inventory/adjust/${item.inventoryId}`, {
          adjustmentAmount: parsedAdjust,
          notes: adjustNotes.trim(),
        });
      }
      if (settingsChanged) {
        await api.put(`/api/inventory/edit/${item.inventoryId}`, {
          reorderLevel: Number(reorderLevel),
          unit: unit.trim() || null,
        });
      }
      const parts = [];
      if (hasAdjustment) {
        const dir = parsedAdjust > 0 ? "increased" : "decreased";
        parts.push(`Stock ${dir} by ${Math.abs(parsedAdjust)} ${selectedUnit}`);
      }
      if (settingsChanged) parts.push("settings updated");
      onClose();
        onSaved();
        showToast(`${parts.join(" and ")} for "${item.productName}".`, "success");
    } catch (err) {
      showToast(err.response?.data?.message ?? "Failed to update inventory.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 flex flex-col shadow-xl" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 shrink-0">
              <Pencil size={16} className="text-teal-600" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Edit Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">{item.productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <form id="editInventoryForm" onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-5">

              {/* Current Stock (read-only) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Current Stock</label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    {currentQty <= (item.reorderLevel ?? 10) && <AlertTriangle size={14} className="text-amber-500" strokeWidth={2.2} />}
                    {currentQty}
                    <span className="font-normal text-slate-400 text-xs">{selectedUnit}</span>
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">read-only</span>
                </div>
              </div>

              {/* Adjustment Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Adjustment Amount <span className="text-slate-400 normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <p className="text-xs text-slate-400 -mt-0.5">Use positive to add stock, negative to remove.</p>
                <div className="relative">
                  <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="number" step="any" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="e.g. +10 or -5" className={`${inputCls} pl-10 ${errors.amount ? errorCls : ""}`} />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{errors.amount}</p>
                )}
              </div>

              {/* Resulting Stock Preview */}
              {hasAdjustment && (
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isNegativeResult ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Resulting Stock</span>
                  <span className={`text-sm font-bold tabular-nums ${isNegativeResult ? "text-red-600" : "text-emerald-600"}`}>
                    {adjustResultQty} <span className="font-normal text-xs text-slate-400">{selectedUnit}</span>
                  </span>
                </div>
              )}
              {isNegativeResult && (
                <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertTriangle size={12} strokeWidth={2.2} />Resulting stock cannot be negative.</p>
              )}

              {/* Notes / Reason */}
              {hasAdjustment && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Reason / Notes <span className="text-red-500 normal-case tracking-normal">*</span>
                  </label>
                  <textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="e.g. Damaged goods removed, Stock correction after audit…" rows={3} maxLength={500} className={`${inputCls} resize-none`} />
                  <div className="flex items-center justify-between">
                    {errors.notes ? (
                      <p className="text-xs text-red-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{errors.notes}</p>
                    ) : <span />}
                    <span className="text-[10px] text-slate-400 tabular-nums">{adjustNotes.length}/500</span>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Settings</span>
                </div>
              </div>

              {/* Reorder Level */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Reorder Level <span className="text-red-500 normal-case tracking-normal">*</span>
                </label>
                <input type="number" min="0" step="0.01" value={reorderLevel} onChange={(e) => { setReorderLevel(e.target.value); if (errors.reorderLevel) setErrors((x) => ({ ...x, reorderLevel: undefined })); }} className={`${inputCls} ${errors.reorderLevel ? errorCls : ""}`} required />
                {errors.reorderLevel ? (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{errors.reorderLevel}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Alert when stock falls below this threshold</p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Unit <span className="text-slate-400 normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <input type="text" maxLength={20} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. kg, pcs, L" className={inputCls} />
              </div>

              {/* General error */}
              {errors.general && (
                <p className="text-xs text-red-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500 inline-block" />{errors.general}</p>
              )}

            </div>
          </form>
        </div>

        {/* Footer — always visible */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 transition-colors duration-150">
            Cancel
          </button>
          <button
            type="submit"
            form="editInventoryForm"
            disabled={saving}
            className="
              inline-flex items-center gap-2
              px-6 py-2.5 rounded-xl text-sm font-semibold
              bg-teal-600
              text-white
              hover:bg-teal-700
              active:scale-95
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150 shadow-sm
            "
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : (
              <><CheckCircle2 size={15} /> Update Inventory</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "In Stock": {
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot:  "bg-emerald-500",
  },
  "Low Stock": {
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot:  "bg-amber-500",
  },
  "Out of Stock": {
    pill: "bg-red-50 text-red-700 border border-red-200",
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
  { key: "actions", label: "Actions & AI Insights", sortable: false },
];

// ─── Component ────────────────────────────────────────────────────────────────
const InventoryStock = () => {
  const { showToast } = useToast();
  // products   = all products (dropdown list for AddStockModal)
  // inventoryItems = only tracked items from /api/inventory/status (table)
  const [products,       setProducts]       = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]); // products with no inventory record yet
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [fetchError,     setFetchError]     = useState(null);
  const [search,         setSearch]         = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");  // "" = All
  const [sortKey,        setSortKey]        = useState("productName");
  const [sortDir,        setSortDir]        = useState("asc");
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);   // inventory item to edit
  const [deleteTarget,   setDeleteTarget]   = useState(null);   // inventory item to delete
  const [deleting,       setDeleting]       = useState(false);
  const [logs,           setLogs]           = useState([]);

  const { refreshInventory } = useInventory();

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

  // ── Fetch products not yet in inventory (for AddStockModal — new entries only)
  const fetchAvailableProducts = () =>
    api.get("/api/products/available-for-inventory").then((res) => {
      setAvailableProducts(
        res.data.map((p) => ({
          ...p,
          sellingPrice:  Number(p.sellingPrice),
          buyingPrice:   Number(p.buyingPrice),
          stockQuantity: 0,
          reorderLevel:  p.reorderLevel != null ? Number(p.reorderLevel) : 10,
        }))
      );
    });

  // ── Fetch all stock movement logs
  const fetchLogs = () =>
    api.get("/api/inventory/logs").then((res) => setLogs(res.data));

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

  // ── Refresh all (used after any mutation)
  const refreshAll = () => {
    setLoading(true);
    setFetchError(null);
    Promise.all([fetchProducts(), fetchAvailableProducts(), fetchInventory(), fetchLogs()])
      .then(() => refreshInventory())   // keep context analytics in sync
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
      setDeleteTarget(null);
      refreshAll();
      showToast(`Stopped tracking "${deleteTarget.productName}".`, "success");
    } catch (err) {
      showToast(err.response?.data?.message ?? "Something went wrong. Please try again.", "error");
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

  // ── Derived category list for the filter dropdown
  const categoryOptions = [...new Set(inventoryItems.map((i) => i.category).filter(Boolean))].sort();

  // ── Filtered + Sorted Data (from /api/inventory/status → inventoryItems only)
  const filtered = inventoryItems
    .filter(({ productName, category, sku }) => {
      const q = search.toLowerCase();
      const matchesSearch =
        productName.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q);
      const matchesCategory =
        !selectedCategory || category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      const cmp  = typeof valA === "string" ? valA.localeCompare(valB) : valA - valB;
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── lowStockCount still used in the table footer badge
  const lowStockCount  = inventoryItems.filter((p) => deriveStatus(p.stockQuantity, p.reorderLevel) !== "In Stock").length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* ── Scrollable page content ─────────────────────────────── */}

      {/* ── Full-page loading state ────────────────────────── */}
      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {/* Layered ring spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">
              Loading Inventory
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Fetching your product stock levels…
            </p>
          </div>
        </div>
      )}

      {/* ── Full-page error state ───────────────────────────── */}
      {!loading && fetchError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
          {/* Icon illustration */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle size={36} strokeWidth={1.5} className="text-red-500" />
          </div>
          {/* Message */}
          <div className="text-center max-w-sm">
            <p className="text-xl font-bold text-slate-900">
              Error Loading Data
            </p>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {fetchError}
            </p>
          </div>
          {/* Retry button */}
          <button
            type="button"
            onClick={fetchProducts}
            className="
              inline-flex items-center gap-2
              px-6 py-3 rounded-xl text-[13px] font-semibold
              bg-teal-600
              text-white
              hover:bg-teal-700
              active:scale-95 transition-all duration-150
              shadow-sm focus:ring-2 focus:ring-teal-600 focus:ring-offset-2
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
      <div className="w-full max-w-none py-8 space-y-8 px-4 sm:px-6 lg:px-8">
      <AddStockModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        products={availableProducts}
        inventoryItems={inventoryItems}
        onStockUpdated={refreshAll}
      />
      <EditInventoryModal
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50">
                <Trash2 size={18} className="text-red-500" strokeWidth={1.8} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove from Tracking</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will NOT delete the product.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Stop tracking inventory for{" "}
              <span className="font-semibold text-slate-900">{deleteTarget.productName}</span>?{" "}
              The product will remain in your catalogue.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-600 focus:ring-offset-2 active:scale-95 disabled:opacity-60 transition-all shadow-sm"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory Stock</h1>
            <p className="text-sm text-slate-500">
              Monitor stock levels and manage your product catalogue
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-600 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95"
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          Add Inventory Stock
        </button>
      </div>

      {/* ── Analytics Cards (from InventoryContext) ───────────────────── */}
      <InventoryAnalyticsCards />

      {/* ── Search + Category Filter Row ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">

        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or category…"
            className="
              w-full bg-white
              border border-slate-200
              rounded-xl shadow-sm
              pl-9 pr-8 py-2.5
              text-sm text-slate-700
              placeholder:text-slate-400
              outline-none
              focus:ring-2 focus:ring-slate-200 focus:border-slate-400
              transition-all duration-200
            "
          />
        </div>

        {/* Category dropdown */}
        <div className="relative w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition-all shadow-sm"
          >
            <option value="">All Categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        {/* Clear Filters */}
        {(search || selectedCategory) && (
          <button
            onClick={() => { setSearch(""); setSelectedCategory(""); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {COLUMNS.map(({ key, label, sortable }) => (
                  <th
                    key={key}
                    onClick={() => sortable && handleSort(key)}
                    className={`px-6 py-4 font-semibold text-slate-600 ${sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                      {sortable && sortKey === key && (
                        sortDir === "asc" ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

          {/* Body */}
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
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
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                  >
                    {/* Product Name */}
                    <td className="px-6 py-6 font-medium text-slate-900 border-b border-slate-100/50">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}
                        >
                          <Icon size={20} className={iconColor} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 whitespace-nowrap">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-6 text-slate-500 text-sm border-b border-slate-100/50 whitespace-nowrap">
                      {item.category}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-6 font-medium text-slate-700 tabular-nums border-b border-slate-100/50">
                      {formatCurrency(item.sellingPrice)}
                    </td>

                    {/* Quantity (stockQuantity) */}
                    <td className="px-6 py-6 border-b border-slate-100/50">
                      <div className="flex items-center gap-2">
                        {isWarning && (
                          <span title="Low quantity warning">
                            <AlertTriangle
                              size={16}
                              className="text-amber-500 flex-shrink-0"
                            />
                          </span>
                        )}
                        <span
                          className={`font-semibold tabular-nums ${
                            qty === 0
                              ? "text-red-600"
                              : isWarning
                              ? "text-amber-600"
                              : "text-slate-700"
                          }`}
                        >
                          {qty}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.unit ?? "units"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-6 border-b border-slate-100/50 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-6 border-b border-slate-100/50 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isLow && (
                          <button
                            type="button"
                            title="Suggest AI reorder quantity"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                          >
                            <Sparkles size={14} />
                            Suggest Order
                          </button>
                        )}
                        <button
                          onClick={() => setEditTarget(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Inventory"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from inventory"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:px-6 flex items-center justify-between gap-4 mt-auto">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{filtered.length}</span> of <span className="text-slate-900">{inventoryItems.length}</span> items
          </p>
          {lowStockCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <AlertTriangle size={16} />
              {lowStockCount} items need restocking
            </span>
          )}
        </div>
      </div>

      {/* ── Stock Movement History ───────────────────────────────────────── */}
      <section className="mt-2">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Stock Movement History
        </h2>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  { label: "Product",          w: "w-[35%]" },
                  { label: "Qty Changed",      w: "w-[18%]" },
                  { label: "Stock After",      w: "w-[18%]" },
                  { label: "Type",             w: "w-[14%]" },
                  { label: "Timestamp",        w: "w-[15%]" },
                ].map(({ label, w }) => (
                  <th
                    key={label}
                    className={`${w} px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-slate-500`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    <Loader2 size={18} className="inline-block animate-spin mr-2" />
                    Loading history…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isIn     = log.quantityChanged >= 0;
                  const qtyLabel = isIn
                    ? `+${log.quantityChanged}`
                    : `${log.quantityChanged}`;
                  const typeLabel = isIn ? "Stock In" : "Stock Out";

                  // Format timestamp: YYYY-MM-DD HH:mm
                  const dt = new Date(log.timestamp);
                  const pad = (n) => String(n).padStart(2, "0");
                  const formatted = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ` +
                    `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors duration-100"
                    >
                      {/* Product name */}
                      <td className="px-5 py-3.5 font-medium text-slate-700 truncate max-w-0">
                        <span className="truncate block">{log.productName}</span>
                      </td>

                      {/* Quantity changed */}
                      <td className={`px-5 py-3.5 font-semibold tabular-nums ${
                        isIn
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}>
                        {qtyLabel}
                      </td>

                      {/* Stock after */}
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                        {log.stockAfter}
                      </td>

                      {/* Type badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isIn
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {typeLabel}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-slate-400 text-xs tabular-nums">
                        {formatted}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          {!loading && logs.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                {logs.length} transaction{logs.length > 1 ? "s" : ""} recorded
              </p>
            </div>
          )}
        </div>
      </section>

      </div>
      )}
    </div>
  );
};

export default InventoryStock;
