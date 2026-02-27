import { useEffect, useState } from "react";
import { X, PackageCheck, Package, Search, CheckSquare, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";
import { products, type Product } from "@/data/products";

interface AssignProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

/* Category pill colour map */
const categoryColour: Record<string, string> = {
  Fruits:     "bg-rose-500/10   text-rose-600   dark:text-rose-400",
  Dairy:      "bg-blue-500/10   text-blue-600   dark:text-blue-400",
  Beverages:  "bg-sky-500/10    text-sky-600    dark:text-sky-400",
  Bakery:     "bg-amber-500/10  text-amber-600  dark:text-amber-400",
  Snacks:     "bg-lime-500/10   text-lime-600   dark:text-lime-500",
  Meat:       "bg-red-500/10    text-red-600    dark:text-red-400",
  Vegetables: "bg-green-500/10  text-green-600  dark:text-green-400",
};

/* Product row */
function ProductRow({
  product,
  checked,
  onToggle,
}: {
  product: Product;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      htmlFor={`assign-${product.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors",
        "border",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      {/* Custom checkbox */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked
            ? "border-primary bg-primary text-white"
            : "border-border bg-background"
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

      {/* Product icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[18px] select-none">
        {product.category === "Dairy"      && "🥛"}
        {product.category === "Fruits"     && "🍎"}
        {product.category === "Beverages"  && "🧃"}
        {product.category === "Bakery"     && "🍞"}
        {product.category === "Snacks"     && "🍿"}
        {product.category === "Meat"       && "🥩"}
        {product.category === "Vegetables" && "🥦"}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px] font-semibold leading-tight", checked ? "text-foreground" : "text-foreground")}>
          {product.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5", categoryColour[product.category] ?? "bg-muted text-muted-foreground")}>
            {product.category}
          </span>
          <span className="text-[11px] text-muted-foreground">${product.price.toFixed(2)} / {product.unit}</span>
        </div>
      </div>

      {/* Stock */}
      <span className={cn(
        "text-[11px] font-semibold shrink-0 tabular-nums",
        product.stock === 0
          ? "text-red-500"
          : product.stock <= 5
          ? "text-amber-500"
          : "text-muted-foreground"
      )}>
        {product.stock === 0 ? "Out" : `${product.stock} in stock`}
      </span>
    </label>
  );
}

/* We show only the first 5 diverse products from the existing mock list */
const ASSIGNABLE_PRODUCTS: Product[] = [
  products.find((p) => p.id === "4")!, // Whole Milk
  products.find((p) => p.id === "9")!, // Sourdough Bread
  products.find((p) => p.id === "2")!, // Fuji Apples
  products.find((p) => p.id === "7")!, // Orange Juice
  products.find((p) => p.id === "12")!, // Chicken Breast
];

export function AssignProductsModal({ isOpen, onClose, supplier }: AssignProductsModalProps) {
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);

  /* Reset every time the modal opens */
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
      setSearch("");
      setSaving(false);
    }
  }, [isOpen]);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const filtered = ASSIGNABLE_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const allChecked   = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked  = filtered.some((p) => selected.has(p.id)) && !allChecked;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      if (onAssign) onAssign([...selected]);
      setSaving(false);
      onClose();
    }, 400);
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
      <div className={cn(
        "relative z-10 flex flex-col w-full max-w-lg max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="assign-products-title" className="text-[16px] font-bold text-foreground leading-tight">
                Assign Products
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Supplier:{" "}
                <span className="font-semibold text-foreground">{supplier.companyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Search + select-all bar ── */}
        <div className="px-6 pt-4 pb-2 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="h-9 pl-8 text-[13px]"
            />
          </div>

          {/* Select all row */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={toggleAll}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                allChecked
                  ? "border-primary bg-primary text-white"
                  : someChecked
                  ? "border-primary bg-primary/20"
                  : "border-border bg-background"
              )}
            >
              {allChecked && (
                <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-current stroke-[2.5]">
                  <polyline points="1.5,5 4.5,8 10.5,2" />
                </svg>
              )}
              {someChecked && <div className="h-2 w-2 rounded-sm bg-primary" />}
            </div>
            <span className="text-[12px] font-medium text-muted-foreground">
              {allChecked ? "Deselect all" : "Select all"}
            </span>
            {selected.size > 0 && (
              <span className="ml-auto text-[11px] font-semibold text-primary">
                {selected.size} selected
              </span>
            )}
          </label>
        </div>

        {/* ── Product list (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-1 min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">No products match your search.</p>
            </div>
          ) : (
            filtered.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                checked={selected.has(product.id)}
                onToggle={() => toggle(product.id)}
              />
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4 shrink-0">
          <p className="text-[12px] text-muted-foreground">
            {selected.size === 0
              ? "No products selected"
              : `${selected.size} product${selected.size !== 1 ? "s" : ""} will be assigned`}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-5 text-[13px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || selected.size === 0}
              className="h-9 px-5 text-[13px] gap-2 shadow-sm"
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
