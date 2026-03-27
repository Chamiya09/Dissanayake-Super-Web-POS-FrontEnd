import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductTable } from "@/components/Products/ProductTable";
import { AddProductModal } from "@/components/Products/AddProductModal";
import { EditProductModal } from "@/components/Products/EditProductModal";
import { DeleteProductModal } from "@/components/Products/DeleteProductModal";
import { Package, Plus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { Product } from "@/data/product-management";
import { productApi } from "@/api/productApi";
import { useToast } from "@/context/GlobalToastContext";
export type { Product };


/* ─────────────────────────────────────────────────────────────────────────
   ProductManagement  —  main page
   ───────────────────────────────────────────────────────────────────────── */
export default function ProductManagement() {
  const { showToast } = useToast();
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
      setFetchError("Failed to load products. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Sync to localStorage whenever the product list changes ── */
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("products", JSON.stringify(products));
    }
  }, [products, loading]);

  /* ── CRUD handlers ── */
  const handleAdd = useCallback(async (data: Omit<Product, "id">) => {
    try {
      const created = await productApi.create(data);
      setProducts((prev) => [...prev, created]);
      showToast("Product added successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to create product.");
    }
  }, []);

  const handleEdit = useCallback(async (updated: Product) => {
    try {
      const { id, ...payload } = updated;
      const saved = await productApi.update(id, payload);
      setProducts((prev) => prev.map((p) => (p.id === id ? saved : p)));
      showToast("Product updated successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to update product.");
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await productApi.remove(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast("Product deleted successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to delete product.");
    }
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-none py-8 space-y-8 px-4 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                Product Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {loading
                  ? "Loading products…"
                  : `${products.length} product${products.length !== 1 ? "s" : ""} registered`
                }
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-600 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add New Product
          </button>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Products", value: loading ? "—" : products.length, bg: "bg-blue-50", text: "text-blue-600" },
            { label: "Categories",     value: loading ? "—" : categories, bg: "bg-indigo-50", text: "text-indigo-600" },
            { label: "Avg. Margin",    value: loading ? "—" : `${avgMargin.toFixed(1)}%`, bg: "bg-emerald-50", text: "text-emerald-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{stat.label}</span>
                <span className="mt-1 text-3xl font-bold text-slate-900 leading-none tabular-nums">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500 font-medium">Loading products…</p>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 flex items-start gap-3 max-w-md w-full">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700">
                  Could not fetch products
                </p>
                <p className="text-xs text-red-600/80">{fetchError}</p>
              </div>
            </div>
            <button
              onClick={fetchProducts}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
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
      </main>

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
