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

  const handleSave = () => {
    const err = validateForm(form);
    if (Object.keys(err).length) { setErrors(err); return; }
    if (!product) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        id:           product.id,
        productName:  form.productName.trim(),
        sku:          form.sku.trim(),
        category:     form.category,
        buyingPrice:  Number(form.buyingPrice),
        sellingPrice: Number(form.sellingPrice),
        unit:         form.unit || undefined,
      });
      setSaving(false);
      onClose();
    }, 400);
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
          "relative z-10 w-full max-w-lg rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 shrink-0">
              <Package className="h-[18px] w-[18px] text-white dark:text-slate-900" />
            </div>
            <div>
              <h2
                id="edit-product-title"
                className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight"
              >
                Edit Product
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                Update details for{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{product.productName}</span>.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 dark:text-slate-500 font-medium">
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
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-5 text-[13px] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 text-[13px] gap-2 shadow-sm bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
