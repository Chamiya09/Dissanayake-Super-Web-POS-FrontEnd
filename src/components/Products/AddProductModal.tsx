import { useState, useEffect, useRef } from "react";
import {
  Package, X, Tag, Hash, Layers,
  DollarSign, Loader2, ShoppingBag,
  Wifi, ScanLine, CheckCircle2, AlertCircle, Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";

/* ─────────────────────────────────────────────────────────────────────────
   Shared form constants — exported so EditProductModal can reuse them
   ───────────────────────────────────────────────────────────────────────── */

export const CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Rice & Grains",
  "Dhal & Pulses",
  "Flour & Baking",
  "Cooking Oil",
  "Spices & Condiments",
  "Dairy Products",
  "Eggs & Meat",
  "Instant Food",
  "Snacks",
  "Beverages",
  "Tea & Coffee",
  "Frozen Foods",
  "Canned Foods",
  "Baby Products",
  "Personal Care",
  "Cleaning Products",
  "Household Items",
] as const;

export const UNITS = [
  "kg", "g", "L", "ml", "pieces", "bottles", "packets", "box",
] as const;

/* ─────────────────────────────────────────────────────────────────────────
   Barcode lookup database — maps barcode → product defaults
   In a real app this would hit a backend/Open Food Facts API.
   ───────────────────────────────────────────────────────────────────────── */
type BarcodeEntry = {
  sku:          string;
  productName:  string;
  category:     string;
  buyingPrice:  number;
  sellingPrice: number;
};

const BARCODE_DB: Record<string, BarcodeEntry> = {
  "4011":  { sku: "4011",  productName: "Organic Bananas",       category: "Fruits",     buyingPrice: 0.80, sellingPrice: 1.29 },
  "7001":  { sku: "7001",  productName: "Whole Milk 1L",         category: "Dairy",      buyingPrice: 2.50, sellingPrice: 3.79 },
  "8010":  { sku: "8010",  productName: "Orange Juice 1L",       category: "Beverages",  buyingPrice: 2.80, sellingPrice: 4.29 },
  "9001":  { sku: "9001",  productName: "Sourdough Bread",       category: "Bakery",     buyingPrice: 3.50, sellingPrice: 5.99 },
  "5001":  { sku: "5001",  productName: "Chicken Breast 1kg",    category: "Meat",       buyingPrice: 6.50, sellingPrice: 9.99 },
  "1234":  { sku: "1234",  productName: "Cheddar Cheese 250g",   category: "Dairy",      buyingPrice: 3.20, sellingPrice: 5.49 },
  "5678":  { sku: "5678",  productName: "Apple Juice 500ml",     category: "Beverages",  buyingPrice: 1.10, sellingPrice: 1.99 },
  "9012":  { sku: "9012",  productName: "Greek Yogurt 200g",     category: "Dairy",      buyingPrice: 1.80, sellingPrice: 2.99 },
  "3456":  { sku: "3456",  productName: "Sweet Potatoes 500g",   category: "Vegetables", buyingPrice: 1.20, sellingPrice: 2.49 },
  "7890":  { sku: "7890",  productName: "Potato Chips 150g",     category: "Snacks",     buyingPrice: 0.90, sellingPrice: 1.79 },
  "2345":  { sku: "2345",  productName: "Whole Wheat Bread",     category: "Bakery",     buyingPrice: 2.10, sellingPrice: 3.49 },
  "6789":  { sku: "6789",  productName: "Fresh Strawberries",    category: "Fruits",     buyingPrice: 2.60, sellingPrice: 4.29 },
};

export type FormFields = {
  productName:  string;
  sku:          string;
  category:     string;
  buyingPrice:  string;
  sellingPrice: string;
  unit:         string;
};

export const EMPTY_FORM: FormFields = {
  productName:  "",
  sku:          "",
  category:     "",
  buyingPrice:  "",
  sellingPrice: "",
  unit:         "",
};

export function validateForm(form: FormFields): Partial<FormFields> {
  const err: Partial<FormFields> = {};
  if (!form.productName.trim())  err.productName  = "Product name is required.";
  if (!form.sku.trim())          err.sku          = "SKU / Barcode is required.";
  if (!form.category)            err.category     = "Please select a category.";
  if (!form.buyingPrice.trim()) {
    err.buyingPrice = "Buying price is required.";
  } else if (isNaN(Number(form.buyingPrice)) || Number(form.buyingPrice) < 0) {
    err.buyingPrice = "Enter a valid price (≥ 0).";
  }
  if (!form.sellingPrice.trim()) {
    err.sellingPrice = "Selling price is required.";
  } else if (isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0) {
    err.sellingPrice = "Enter a valid price (≥ 0).";
  }
  return err;
}

/* ─────────────────────────────────────────────────────────────────────────
   FormRow — reusable labeled field row, exported for EditProductModal
   Mirrors AddSupplierModal's FormRow exactly
   ───────────────────────────────────────────────────────────────────────── */
export function FormRow({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id:       string;
  label:    string;
  icon:     React.ElementType;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AddProductModal
   ───────────────────────────────────────────────────────────────────────── */
export interface AddProductModalProps {
  isOpen:  boolean;
  onClose: () => void;
  onSave:  (data: Omit<Product, "id">) => void;
}

export function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
  const [form,          setForm]        = useState<FormFields>(EMPTY_FORM);
  const [errors,        setErrors]      = useState<Partial<FormFields>>({});
  const [saving,        setSaving]      = useState(false);
  const [barcodeInput,  setBarcodeInput] = useState("");
  const [scanStatus,    setScanStatus]  = useState<"idle" | "found" | "notfound" | "scanning">("idle");
  const barcodeRef = useRef<HTMLInputElement>(null);
  const firstRef   = useRef<HTMLInputElement>(null);

  /* Reset form and focus barcode input on every open */
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSaving(false);
      setBarcodeInput("");
      setScanStatus("idle");
      setTimeout(() => barcodeRef.current?.focus(), 80);
    }
  }, [isOpen]);

  /* Barcode lookup — auto-fills all form fields if found */
  const handleBarcodeLookup = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const match = BARCODE_DB[trimmed];
    if (match) {
      setForm({
        productName:  match.productName,
        sku:          match.sku,
        category:     match.category,
        buyingPrice:  String(match.buyingPrice),
        sellingPrice: String(match.sellingPrice),
        unit:         form.unit,
      });
      setErrors({});
      setScanStatus("found");
    } else {
      // Unknown barcode — pre-fill SKU and let user complete the rest
      setForm((prev) => ({ ...prev, sku: trimmed }));
      setScanStatus("notfound");
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  };

  /* Debounce auto-lookup: fires 300 ms after scanner stops typing */
  useEffect(() => {
    if (!barcodeInput.trim()) return;
    setScanStatus("scanning");
    const timer = setTimeout(() => handleBarcodeLookup(barcodeInput), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeInput]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const set = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user types
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const err = validateForm(form);
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      await onSave({
        productName:  form.productName.trim(),
        sku:          form.sku.trim(),
        category:     form.category,
        buyingPrice:  Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice),
        unit:         form.unit || undefined,
      });
      onClose();
    } catch (e) {
      // error handled by parent
    } finally {
      if (isOpen) setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-product-title"
    >
      {/* Dimmed overlay — click outside to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
              <Package size={20} />
            </div>
            <div>
              <h2
                id="add-product-title"
                className="text-base font-bold text-slate-800 leading-tight"
              >
                Add Product
              </h2>
              <p className="text-[12px] text-sm text-slate-500 mt-1">
                Fill in the details to register a new product.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-muted hover:text-accent-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* ── Barcode Scan Section ── */}
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ScanLine className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-semibold text-slate-800">Scan Barcode</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Point scanner at barcode</span>
            </div>

            {/* Scanner input — full width, captures scanner keystrokes */}
            <div className="relative">
              <ScanLine
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                  scanStatus === "scanning" ? "text-violet-600 animate-pulse" : "text-muted-foreground"
                )}
              />
              {scanStatus === "scanning" && (
                <Wifi className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
              )}
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Ready to scan…"
                autoComplete="off"
                className={cn(
                  "flex h-11 w-full rounded-md border bg-white px-3 py-2 text-[13px] font-mono pl-9 pr-9",
                  "placeholder:text-slate-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  scanStatus === "scanning" && "border-primary/60",
                  scanStatus === "found"    && "border-emerald-500 focus-visible:ring-emerald-400",
                  scanStatus === "notfound" && "border-amber-400 focus-visible:ring-amber-400",
                  scanStatus === "idle"     && "border-input"
                )}
              />
            </div>

            {/* Scan status banners */}
            {scanStatus === "scanning" && (
              <div className="flex items-center gap-2 rounded-lg bg-violet-50/50 border border-violet-200 px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                <span className="text-[12px] text-primary font-medium">Scanning…</span>
              </div>
            )}
            {scanStatus === "found" && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50/50 border border-emerald-500/20 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-[12px] text-emerald-700 font-medium">
                  Product found — details auto-filled below. Review and save.
                </span>
              </div>
            )}
            {scanStatus === "notfound" && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50/50 border border-amber-500/20 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[12px] text-amber-700 font-medium">
                  Barcode not in database — SKU pre-filled. Complete the remaining fields.
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Product Details</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Product Name — full width */}
          <FormRow id="productName" label="Product Name" icon={ShoppingBag} error={errors.productName}>
            <Input
              id="productName"
              ref={firstRef}
              value={form.productName}
              onChange={(e) => set("productName", e.target.value)}
              placeholder="e.g. Organic Bananas"
              className={cn(
                "h-10 text-[13px]",
                errors.productName && "border-red-400 focus-visible:ring-red-400"
              )}
            />
          </FormRow>

          {/* SKU  +  Category — side by side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="sku" label="SKU / Barcode" icon={Hash} error={errors.sku}>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. 4011"
                className={cn(
                  "h-10 text-[13px] font-mono",
                  errors.sku && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </FormRow>

            <FormRow id="category" label="Category" icon={Layers} error={errors.category}>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger
                  id="category"
                  className={cn(
                    "h-10 text-[13px]",
                    errors.category && "border-red-400 focus-visible:ring-red-400"
                  )}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </div>

          {/* Buying Price  +  Selling Price — side by side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="buyingPrice" label="Buying Price" icon={DollarSign} error={errors.buyingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="buyingPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.buyingPrice}
                  onChange={(e) => set("buyingPrice", e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "h-10 text-[13px] pl-6",
                    errors.buyingPrice && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
              </div>
            </FormRow>

            <FormRow id="sellingPrice" label="Selling Price" icon={Tag} error={errors.sellingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="sellingPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.sellingPrice}
                  onChange={(e) => set("sellingPrice", e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "h-10 text-[13px] pl-6",
                    errors.sellingPrice && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
              </div>
            </FormRow>
          </div>

          {/* Unit — optional, full width */}
          <FormRow id="unit" label="Unit (optional)" icon={Ruler}>
            <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
              <SelectTrigger id="unit" className="h-10 text-[13px]">
                <SelectValue placeholder="Select unit of measurement" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

