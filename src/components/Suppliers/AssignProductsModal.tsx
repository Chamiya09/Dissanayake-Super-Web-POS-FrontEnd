import { useEffect, useState } from "react";
import { X, PackageCheck, Package, Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";

/* ── Backend product shape (mirrors ProductManagement / /api/products) ── */
export interface MgmtProduct {
  id: number;
  productName: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  unit?: string;
}

interface AssignProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  /** Real products fetched from /api/products by the parent page */
  availableProducts: MgmtProduct[];
  /** True while the parent is still loading the product list */
  productsLoading?: boolean;
  /** Called with the selected product IDs; parent handles the API call */
  onAssign: (productIds: number[]) => Promise<void>;
}

/* ── Category emoji map ── */
const categoryEmoji: Record<string, string> = {
  "Fruits":              "🍎",
  "Vegetables":          "🥦",
  "Rice & Grains":       "🌾",
  "Dhal & Pulses":       "🫘",
  "Flour & Baking":      "🌾",
  "Cooking Oil":         "🫙",
  "Spices & Condiments": "🌶️",
  "Dairy Products":      "🥛",
  "Eggs & Meat":         "🥩",
  "Instant Food":        "🍜",
  "Snacks":              "🍿",
  "Beverages":           "🧃",
  "Tea & Coffee":        "☕",
  "Frozen Foods":        "🧊",
  "Canned Foods":        "🥫",
  "Baby Products":       "👶",
  "Personal Care":       "🧴",
  "Cleaning Products":   "🧹",
  "Household Items":     "🏠",
};

/* ── Category pill colour map ── */
const categoryColour: Record<string, string> = {
  "Fruits":              "bg-rose-50    text-rose-600",
  "Vegetables":          "bg-green-50   text-green-600",
  "Rice & Grains":       "bg-yellow-50  text-yellow-600",
  "Dhal & Pulses":       "bg-orange-50  text-orange-600",
  "Flour & Baking":      "bg-amber-50   text-amber-600",
  "Cooking Oil":         "bg-yellow-50  text-yellow-700",
  "Spices & Condiments": "bg-red-50     text-red-600",
  "Dairy Products":      "bg-blue-50    text-blue-600",
  "Eggs & Meat":         "bg-red-50     text-red-700",
  "Instant Food":        "bg-purple-50  text-purple-600",
  "Snacks":              "bg-lime-50    text-lime-600",
  "Beverages":           "bg-sky-50     text-sky-600",
  "Tea & Coffee":        "bg-amber-50   text-amber-700",
  "Frozen Foods":        "bg-cyan-50    text-cyan-600",
  "Canned Foods":        "bg-slate-50   text-slate-600",
  "Baby Products":       "bg-pink-50    text-pink-600",
  "Personal Care":       "bg-violet-50  text-violet-600",
  "Cleaning Products":   "bg-teal-50    text-teal-600",
  "Household Items":     "bg-indigo-50  text-indigo-600",
};

/* ── Single product row ── */
function ProductRow({
  product,
  checked,
  onToggle,
}: {
  product: MgmtProduct;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      htmlFor={`assign-${product.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors border",
        checked
          ? "border-indigo-200 bg-indigo-50/60"
          : "border-transparent hover:bg-slate-50"
      )}
    >
      {/* Custom checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked
            ? "border-indigo-500 bg-indigo-500 text-white"
            : "border-slate-300 bg-white"
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
            <polyline points="1.5,5 4.5,8 10.5,2" />
          </svg>
        )}
      </div>
      <input
        id={`assign-${product.id}`}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />

      {/* Category emoji icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[17px] select-none">
        {categoryEmoji[product.category] ?? "📦"}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">
          {product.productName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-semibold rounded-full px-2 py-0.5",
              categoryColour[product.category] ?? "bg-slate-100 text-slate-500"
            )}
          >
            {product.category}
          </span>
          <span className="text-[11px] text-slate-400">
            Rs.{product.sellingPrice.toFixed(2)}{product.unit ? ` / ${product.unit}` : ""}
          </span>
          <span className="text-[11px] text-slate-300">·</span>
          <span className="text-[11px] text-slate-400 font-mono">{product.sku}</span>
        </div>
      </div>
    </label>
  );
}

export function AssignProductsModal({
  isOpen,
  onClose,
  supplier,
  availableProducts,
  productsLoading = false,
  onAssign,
}: AssignProductsModalProps) {
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* Reset every time the modal opens */
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
      setSearch("");
      setSaving(false);
      setSaveError(null);
    }
  }, [isOpen]);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = availableProducts.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.productName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const allChecked  = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked = filtered.some((p) => selected.has(p.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onAssign(Array.from(selected));
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to assign products. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="assign-products-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 flex flex-col w-full max-w-lg max-h-[90vh]",
          "rounded-2xl border border-slate-100 bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="assign-products-title"
                className="text-[16px] font-bold text-slate-900 leading-tight"
              >
                Assign Products
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Supplier:{" "}
                <span className="font-semibold text-slate-700">{supplier.companyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Search + select-all bar ── */}
        <div className="px-6 pt-4 pb-3 space-y-3 shrink-0 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or SKU…"
              className="h-10 pl-8 text-[13px] bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-300"
              disabled={productsLoading}
            />
          </div>

          {/* Select all row */}
          {!productsLoading && filtered.length > 0 && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={toggleAll}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors cursor-pointer",
                  allChecked
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : someChecked
                    ? "border-indigo-400 bg-indigo-100"
                    : "border-slate-300 bg-white"
                )}
              >
                {allChecked && (
                  <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
                    <polyline points="1.5,5 4.5,8 10.5,2" />
                  </svg>
                )}
                {someChecked && <div className="h-2 w-2 rounded-sm bg-indigo-500" />}
              </div>
              <span className="text-[12px] font-medium text-slate-500">
                {allChecked ? "Deselect all" : "Select all"}
              </span>
              {selected.size > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {selected.size} selected
                </span>
              )}
            </label>
          )}
        </div>

        {/* ── Product list (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
          {/* Loading skeleton */}
          {productsLoading && (
            <div className="space-y-2 py-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-3 rounded-xl px-4 py-3 border border-transparent animate-pulse">
                  <div className="h-5 w-5 rounded-md bg-slate-200 shrink-0" />
                  <div className="h-9 w-9 rounded-lg bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty — no products on the backend */}
          {!productsLoading && availableProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
              <Package className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium text-slate-500">No products found</p>
              <p className="text-xs">Add products in Product Management first.</p>
            </div>
          )}

          {/* Empty — search has no matches */}
          {!productsLoading && availableProducts.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Package className="h-8 w-8 opacity-20" />
              <p className="text-sm">No products match your search.</p>
            </div>
          )}

          {/* Product rows */}
          {!productsLoading &&
            filtered.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                checked={selected.has(product.id)}
                onToggle={() => toggle(product.id)}
              />
            ))}
        </div>

        {/* ── Save error ── */}
        {saveError && (
          <div className="mx-6 mb-2 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <p className="text-[12px] text-slate-400">
            {selected.size === 0
              ? "No products selected"
              : `${selected.size} product${selected.size !== 1 ? "s" : ""} will be assigned`}
          </p>
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-5 text-[13px] border-slate-200 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selected.size === 0 || productsLoading}
              className="h-9 px-5 text-[13px] gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <PackageCheck className="h-3.5 w-3.5" />
                  Save Assignments
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
