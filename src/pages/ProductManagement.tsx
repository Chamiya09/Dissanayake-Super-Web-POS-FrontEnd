import { useState, useCallback, useEffect, useRef } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductTable } from "@/components/Products/ProductTable";
import {
  AddProductModal,
  FormRow,
  EMPTY_FORM,
  validateForm,
  CATEGORIES,
} from "@/components/Products/AddProductModal";
import type { FormFields } from "@/components/Products/AddProductModal";
import {
  Package, Plus, X, Tag, Hash, Layers,
  DollarSign, Loader2, ShoppingBag,
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
export type { Product };

/* ── Mock seed data ── */
const INITIAL_PRODUCTS: Product[] = [
  { id: "PRD-001", productName: "Organic Bananas",   sku: "4011", category: "Fruits",     buyingPrice: 0.80, sellingPrice: 1.29 },
  { id: "PRD-002", productName: "Whole Milk",        sku: "7001", category: "Dairy",      buyingPrice: 2.50, sellingPrice: 3.79 },
  { id: "PRD-003", productName: "Orange Juice",      sku: "8010", category: "Beverages",  buyingPrice: 2.80, sellingPrice: 4.29 },
  { id: "PRD-004", productName: "Sourdough Bread",   sku: "9001", category: "Bakery",     buyingPrice: 3.50, sellingPrice: 5.99 },
  { id: "PRD-005", productName: "Chicken Breast",    sku: "5001", category: "Meat",       buyingPrice: 6.50, sellingPrice: 9.99 },
];

/* ── Simple ID generator ── */
let nextId = INITIAL_PRODUCTS.length + 1;
const generateId = () => {
  const id = `PRD-${String(nextId).padStart(3, "0")}`;
  nextId++;
  return id;
};

/* FormRow, FormFields, EMPTY_FORM, validateForm, CATEGORIES
   are imported from @/components/Products/AddProductModal */

/* ─────────────────────────────────────────────────────────────────────────
   Edit Product Modal
   ───────────────────────────────────────────────────────────────────────── */
function EditProductModal({
  isOpen,
  onClose,
  product,
  onSave,
}: {
  isOpen:   boolean;
  onClose:  () => void;
  product:  Product | null;
  onSave:   (updated: Product) => void;
}) {
  const [form,   setForm]   = useState<FormFields>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormFields>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setForm({
        productName:  product.productName,
        sku:          product.sku,
        category:     product.category,
        buyingPrice:  String(product.buyingPrice),
        sellingPrice: String(product.sellingPrice),
      });
      setErrors({});
      setSaving(false);
    }
  }, [isOpen, product]);

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
      });
      setSaving(false);
      onClose();
    }, 400);
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-product-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className={cn(
        "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="edit-product-title" className="text-[16px] font-bold text-foreground leading-tight">
                Edit Product
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Update details for <span className="font-semibold text-foreground">{product.productName}</span>.
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

        {/* Form body (same layout as Add) */}
        <div className="px-6 py-5 space-y-4">
          <FormRow id="edit-productName" label="Product Name" icon={ShoppingBag} error={errors.productName}>
            <Input
              id="edit-productName"
              value={form.productName}
              onChange={(e) => set("productName", e.target.value)}
              placeholder="e.g. Organic Bananas"
              className={cn("h-10 text-[13px]", errors.productName && "border-red-400 focus-visible:ring-red-400")}
            />
          </FormRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="edit-sku" label="SKU / Barcode" icon={Hash} error={errors.sku}>
              <Input
                id="edit-sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. 4011"
                className={cn("h-10 text-[13px] font-mono", errors.sku && "border-red-400 focus-visible:ring-red-400")}
              />
            </FormRow>

            <FormRow id="edit-category" label="Category" icon={Layers} error={errors.category}>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger
                  id="edit-category"
                  className={cn("h-10 text-[13px]", errors.category && "border-red-400 focus-visible:ring-red-400")}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow id="edit-buyingPrice" label="Buying Price" icon={DollarSign} error={errors.buyingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">$</span>
                <Input
                  id="edit-buyingPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.buyingPrice}
                  onChange={(e) => set("buyingPrice", e.target.value)}
                  placeholder="0.00"
                  className={cn("h-10 text-[13px] pl-6", errors.buyingPrice && "border-red-400 focus-visible:ring-red-400")}
                />
              </div>
            </FormRow>

            <FormRow id="edit-sellingPrice" label="Selling Price" icon={Tag} error={errors.sellingPrice}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground font-medium">$</span>
                <Input
                  id="edit-sellingPrice"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.sellingPrice}
                  onChange={(e) => set("sellingPrice", e.target.value)}
                  placeholder="0.00"
                  className={cn("h-10 text-[13px] pl-6", errors.sellingPrice && "border-red-400 focus-visible:ring-red-400")}
                />
              </div>
            </FormRow>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="h-9 px-5 text-[13px]">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="h-9 px-5 text-[13px] gap-2 shadow-sm">
            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Delete Confirm Modal
   ───────────────────────────────────────────────────────────────────────── */
function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: {
  isOpen:    boolean;
  onClose:   () => void;
  product:   Product | null;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (isOpen) setDeleting(false); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleConfirm = () => {
    setDeleting(true);
    setTimeout(() => {
      onConfirm();
      setDeleting(false);
      onClose();
    }, 400);
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-product-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!deleting ? onClose : undefined}
        aria-hidden="true"
      />

      <div className={cn(
        "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        <button
          onClick={onClose}
          disabled={deleting}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:text-red-400 ring-8 ring-red-500/5">
            <Package className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h2 id="delete-product-title" className="text-[18px] font-bold text-foreground">
              Delete Product?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{product.productName}</span>?
              This action cannot be undone.
            </p>
          </div>

          {/* Detail chip */}
          <div className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-left space-y-1">
            <p className="text-[12px] font-semibold text-foreground">{product.productName}</p>
            <p className="text-[11px] text-muted-foreground">
              {product.id} &middot; SKU: {product.sku} &middot; {product.category}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={deleting}
            className={cn(
              "h-9 px-5 text-[13px] gap-2 shadow-sm",
              "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white"
            )}
          >
            {deleting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Deleting…</>
              : <><Package className="h-3.5 w-3.5" />Delete Product</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ProductManagement  —  main page
   ───────────────────────────────────────────────────────────────────────── */
export default function ProductManagement() {
  /* ── Master list (single source of truth, no backend) ── */
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  /* ── Modal state ── */
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;

  /* ── CRUD handlers ── */
  const handleAdd = useCallback((data: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { id: generateId(), ...data }]);
  }, []);

  const handleEdit = useCallback((updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
  }, [deleteTarget]);

  /* ── Derived stats ── */
  const avgMargin =
    products.length === 0
      ? 0
      : products.reduce((sum, p) =>
          sum + (p.buyingPrice > 0 ? ((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100 : 0),
          0
        ) / products.length;

  const categories = [...new Set(products.map((p) => p.category))].length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                Product Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Products",   value: products.length },
            { label: "Categories",       value: categories },
            { label: "Avg. Margin",      value: `${avgMargin.toFixed(1)}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <p className="text-[22px] font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <ProductTable
          products={products}
          onEdit={(p) => setEditTarget(p)}
          onDelete={(p) => setDeleteTarget(p)}
        />
      </div>

      {/* ── Modals ── */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
      />
      <EditProductModal
        isOpen={isEditOpen}
        onClose={() => setEditTarget(null)}
        product={editTarget}
        onSave={handleEdit}
      />
      <DeleteProductModal
        isOpen={isDeleteOpen}
        onClose={() => setDeleteTarget(null)}
        product={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
