import { useState, useEffect } from "react";
import {
  Package, X, Tag, Layers,
  DollarSign, Loader2, ShoppingBag, Ruler,
} from "lucide-react";
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
import { BarcodeInput } from "@/components/Products/BarcodeInput";
import type { Product } from "@/data/product-management";

/* ─────────────────────────────────────────────────────────────────────────
   Shared form constants — exported so EditProductModal can reuse them
   ───────────────────────────────────────────────────────────────────────── */

export const CATEGORIES = [
  "Auto Care",
  "Avurudu Kade",
  "Baby Products",
  "Bakery",
  "Beverages",
  "Cooking Essentials",
  "Dairy",
  "Desserts & Ingredients",
  "Food Cupboard",
  "Frozen Food",
  "Fruits",
  "Health & Beauty",
  "Household",
  "Meats",
  "Party Shop",
  "Pet Products",
  "Rice",
  "Seafood",
  "Seeds & Spices",
  "Snacks & Confectionery",
  "Stationery",
  "Tea & Coffee",
  "Vegetables",
] as const;

export const UNITS = [
  "g", "kg", "Pack", "Unit",
] as const;

export type FormFields = {
  sku:          string;
  productName:  string;
  barcode:      string;
  category:     string;
  buyingPrice:  string;
  sellingPrice: string;
  unit:         string;
};

export const EMPTY_FORM: FormFields = {
  sku:          "",
  productName:  "",
  barcode:      "",
  category:     "",
  buyingPrice:  "",
  sellingPrice: "",
  unit:         "",
};

export function validateForm(form: FormFields): Partial<FormFields> {
  const err: Partial<FormFields> = {};
  if (!form.sku.trim())          err.sku          = "Product ID is required.";
  if (!form.productName.trim())  err.productName  = "Product name is required.";
  if (!form.category)            err.category     = "Please select a category.";
  if (!form.unit)                err.unit         = "Pricing unit is required.";
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

  /* Reset form and focus scanner field on every open */
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

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
      const sku = form.sku.trim();
      const barcode = form.barcode.trim();
      await onSave({
        sku:          sku,
        productName:  form.productName.trim(),
        // Keep barcode independent from SKU; never substitute one for the other.
        barcode:      barcode,
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
                Scan a barcode or enter it manually, then fill the remaining details.
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
          <FormRow id="add-product-sku" label="Product ID (SKU)" icon={Tag} error={errors.sku}>
            <Input
              id="add-product-sku"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="e.g. PI00001"
              autoComplete="off"
              className={cn(
                "h-10 text-[13px] font-mono",
                errors.sku && "border-red-400 focus-visible:ring-red-400"
              )}
            />
          </FormRow>

          <BarcodeInput
            mode="add"
            initialBarcode={form.barcode}
            autoFocus={isOpen}
            disabled={saving}
            inputId="add-product-barcode"
            onBarcodeChange={(value) => set("barcode", value)}
          />

          {/* Product Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="productName" label="Product Name" icon={ShoppingBag} error={errors.productName}>
              <Input
                id="productName"
                value={form.productName}
                onChange={(e) => set("productName", e.target.value)}
                placeholder="e.g. Captain Oats Instant - 500g"
                className={cn(
                  "h-10 text-[13px]",
                  errors.productName && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </FormRow>
          </div>

          {/* Category + Pricing Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <FormRow id="pricingUnit" label="Pricing Unit" icon={Ruler} error={errors.unit}>
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger
                  id="pricingUnit"
                  className={cn(
                    "h-10 text-[13px]",
                    errors.unit && "border-red-400 focus-visible:ring-red-400"
                  )}
                >
                  <SelectValue placeholder="Select pricing unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </div>

          {/* Buying Price + Selling Price */}
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

