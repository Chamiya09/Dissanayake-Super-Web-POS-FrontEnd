import { useState, useEffect } from "react";
import {
  Package, X, Tag, Hash, Layers,
  DollarSign, Loader2, ShoppingBag, Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";
import {
  FormRow,
  EMPTY_FORM,
  validateForm,
  CATEGORIES,
  UNITS,
} from "@/components/Products/AddProductModal";
import type { FormFields } from "@/components/Products/AddProductModal";

/* ─────────────────────────────────────────────────────────────────────────
   EditProductModal
   Mirrors AddProductModal structure exactly — same overlay, panel, header,
   input sizing, error colours, and footer button styles.
   ───────────────────────────────────────────────────────────────────────── */
export interface EditProductModalProps {
  isOpen:  boolean;
  onClose: () => void;
  product: Product | null;
  onSave:  (updated: Product) => void;
}

export function EditProductModal({
  isOpen,
  onClose,
  product,
  onSave,
}: EditProductModalProps) {
  const [form,   setForm]   = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [saving, setSaving] = useState(false);

  /* Pre-fill form fields whenever a product is targeted */
  useEffect(() => {
    if (isOpen && product) {
      setForm({
        productName:  product.productName,
        sku:          product.sku,
        category:     product.category,
        buyingPrice:  String(product.buyingPrice),
        sellingPrice: String(product.sellingPrice),
        unit:         product.unit ?? "",
      });
      setErrors({});
      setSaving(false);
    }
  }, [isOpen, product]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const set = (field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const err = validateForm(form);
    if (Object.keys(err).length) { setErrors(err); return; }
    if (!product) return;
    setSaving(true);
    try {
      await onSave({
        id:           product.id,
        productName:  form.productName.trim(),
        sku:          form.sku.trim(),
        category:     form.category,
        buyingPrice:  Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice),
        unit:         form.unit || undefined,
      });
      onClose();
    } catch (e) {
      // Handled by parent
    } finally {
      if (isOpen) setSaving(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-product-title"
    >
      {/* Dimmed overlay */}
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
                id="edit-product-title"
                className="text-base font-bold text-slate-800 leading-tight"
              >
                Edit Product
              </h2>
              <p className="text-[12px] text-sm text-slate-500 mt-1">
                Update details for{" "}
                <span className="font-semibold text-slate-700">{product.productName}</span>.
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

          {/* Product Name — full width */}
          <FormRow id="edit-productName" label="Product Name" icon={ShoppingBag} error={errors.productName}>
            <Input
              id="edit-productName"
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
            <FormRow id="edit-sku" label="SKU / Barcode" icon={Hash} error={errors.sku}>
              <Input
                id="edit-sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. 4011"
                className={cn(
                  "h-10 text-[13px] font-mono",
                  errors.sku && "border-red-400 focus-visible:ring-red-400"
                )}
              />
            </FormRow>

            <FormRow id="edit-category" label="Category" icon={Layers} error={errors.category}>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger
                  id="edit-category"
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
            <FormRow id="edit-buyingPrice" label="Buying Price" icon={DollarSign} error={errors.buyingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="edit-buyingPrice"
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

            <FormRow id="edit-sellingPrice" label="Selling Price" icon={Tag} error={errors.sellingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">
                  $
                </span>
                <Input
                  id="edit-sellingPrice"
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
          <FormRow id="edit-unit" label="Unit (optional)" icon={Ruler}>
            <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
              <SelectTrigger id="edit-unit" className="h-10 text-[13px]">
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
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
