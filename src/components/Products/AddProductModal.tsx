import { useState, useEffect, useRef } from "react";
import {
  Package, X, Tag, Hash, Layers,
  DollarSign, Loader2, ShoppingBag,
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
  "Fruits", "Dairy", "Beverages", "Bakery", "Snacks", "Meat", "Vegetables",
] as const;

export type FormFields = {
  productName:  string;
  sku:          string;
  category:     string;
  buyingPrice:  string;
  sellingPrice: string;
};

export const EMPTY_FORM: FormFields = {
  productName:  "",
  sku:          "",
  category:     "",
  buyingPrice:  "",
  sellingPrice: "",
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
        className="text-[13px] font-medium text-foreground flex items-center gap-1.5"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">{error}</p>
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
  const [form,   setForm]   = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [saving, setSaving] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  /* Reset form and focus first field on every open */
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSaving(false);
      setTimeout(() => firstRef.current?.focus(), 80);
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

  const handleSave = () => {
    const err = validateForm(form);
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    // Brief artificial delay mirrors AddSupplierModal behaviour
    setTimeout(() => {
      onSave({
        productName:  form.productName.trim(),
        sku:          form.sku.trim(),
        category:     form.category,
        buyingPrice:  Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice),
      });
      setSaving(false);
      onClose();
    }, 400);
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
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Icon badge — mirrors h-9 w-9 rounded-xl bg-primary/10 from Supplier modals */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2
                id="add-product-title"
                className="text-[16px] font-bold text-foreground leading-tight"
              >
                Add Product
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Fill in the details to register a new product.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ── */}
        <div className="px-6 py-5 space-y-4">

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
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          {/* Cancel — outline, mirrors Supplier modals exactly */}
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>

          {/* Save — primary with spinner */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 text-[13px] gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Product"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
