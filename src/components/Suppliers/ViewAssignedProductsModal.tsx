import { useEffect, useState } from "react";
import { X, PackageX, Package, Search, Loader2, AlertCircle, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";
import type { MgmtProduct } from "@/components/Suppliers/AssignProductsModal";
import { supplierApi } from "@/lib/supplierApi";

interface ViewAssignedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

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

export function ViewAssignedProductsModal({
  isOpen,
  onClose,
  supplier,
}: ViewAssignedProductsModalProps) {
  const [products, setProducts]     = useState<MgmtProduct[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [unassigning, setUnassigning] = useState<number | null>(null);

  /* Fetch assigned products whenever the modal opens for a supplier */
  useEffect(() => {
    if (!isOpen || !supplier) return;
    setSearch("");
    setError(null);
    setLoading(true);
    supplierApi
      .getAssignedProducts(supplier.id)
      .then((data) => setProducts(data))
      .catch(() => setError("Failed to load assigned products. Please try again."))
      .finally(() => setLoading(false));
  }, [isOpen, supplier]);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleUnassign = async (product: MgmtProduct) => {
    setUnassigning(product.id);
    try {
      await supplierApi.unassignProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch {
      setError(`Failed to unassign "${product.productName}". Please try again.`);
    } finally {
      setUnassigning(null);
    }
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.productName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  if (!isOpen || !supplier) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="view-assigned-title"
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
          "relative z-10 flex flex-col w-full max-w-2xl max-h-[90vh]",
          "rounded-2xl border border-slate-100 bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="view-assigned-title"
                className="text-[16px] font-bold text-slate-900 leading-tight"
              >
                Assigned Products
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

        {/* ── Search bar ── */}
        <div className="px-6 pt-4 pb-3 shrink-0 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or SKU…"
              className="h-10 pl-8 text-[13px] bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-rose-300"
              disabled={loading}
            />
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-6 mt-3 shrink-0 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-[13px]">Loading assigned products…</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <PackageX className="h-8 w-8 text-slate-300" />
              <p className="text-[13px] font-medium">
                {products.length === 0
                  ? "No products assigned to this supplier yet."
                  : "No products match your search."}
              </p>
            </div>
          )}

          {/* Product rows */}
          {!loading &&
            filtered.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors"
              >
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
                      Rs.{product.sellingPrice.toFixed(2)}
                      {product.unit ? ` / ${product.unit}` : ""}
                    </span>
                    <span className="text-[11px] text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400 font-mono">{product.sku}</span>
                  </div>
                </div>

                {/* Unassign button */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unassigning === product.id}
                  onClick={() => handleUnassign(product)}
                  className="shrink-0 h-8 gap-1.5 text-[12px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 transition-colors"
                >
                  {unassigning === product.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Unlink className="h-3.5 w-3.5" />
                  )}
                  Unassign
                </Button>
              </div>
            ))}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 px-6 py-4 shrink-0 flex items-center justify-between">
          <span className="text-[12px] text-slate-400">
            {loading ? "—" : `${products.length} product${products.length !== 1 ? "s" : ""} assigned`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-5 rounded-xl text-[13px] font-semibold"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
