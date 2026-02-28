import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductTable } from "@/components/Products/ProductTable";
import { AddProductModal } from "@/components/Products/AddProductModal";
import { EditProductModal } from "@/components/Products/EditProductModal";
import { DeleteProductModal } from "@/components/Products/DeleteProductModal";
import { Package, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/product-management";
import { productApi } from "@/api/productApi";
export type { Product };


/* ─────────────────────────────────────────────────────────────────────────
   ProductManagement  —  main page
   ───────────────────────────────────────────────────────────────────────── */
export default function ProductManagement() {
  /* ── Server state ── */
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /* ── Modal state ── */
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;

  /* ── Initial fetch ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await productApi.getAll();
      setProducts(data);
    } catch {
      setFetchError("Failed to load products. Make sure the backend is running on port 8081.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── CRUD handlers ── */
  const handleAdd = useCallback(async (data: Omit<Product, "id">) => {
    const created = await productApi.create(data);
    setProducts((prev) => [...prev, created]);
  }, []);

  const handleEdit = useCallback(async (updated: Product) => {
    const { id, ...payload } = updated;
    const saved = await productApi.update(id, payload);
    setProducts((prev) => prev.map((p) => (p.id === id ? saved : p)));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await productApi.remove(deleteTarget.id);
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
                {loading
                  ? "Loading products…"
                  : `${products.length} product${products.length !== 1 ? "s" : ""} registered`
                }
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            disabled={loading}
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
            { label: "Total Products", value: loading ? "—" : products.length },
            { label: "Categories",     value: loading ? "—" : categories },
            { label: "Avg. Margin",    value: loading ? "—" : `${avgMargin.toFixed(1)}%` },
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

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading products…</p>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-6 py-5 flex items-start gap-3 max-w-md w-full">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">
                  Could not fetch products
                </p>
                <p className="text-[12px] text-red-600/80 dark:text-red-400/80">{fetchError}</p>
              </div>
            </div>
            <Button variant="outline" onClick={fetchProducts} className="gap-2 text-[13px]">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !fetchError && (
          <ProductTable
            products={products}
            onEdit={(p) => setEditTarget(p)}
            onDelete={(p) => setDeleteTarget(p)}
          />
        )}
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
