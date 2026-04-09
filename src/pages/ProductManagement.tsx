import { useState, useCallback, useEffect } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { ProductTable } from "@/components/Products/ProductTable";
import { AddProductModal } from "@/components/Products/AddProductModal";
import { EditProductModal } from "@/components/Products/EditProductModal";
import { DeleteProductModal } from "@/components/Products/DeleteProductModal";
import { ViewProductModal } from "@/components/Products/ViewProductModal";
import { ImportProductsCsvModal } from "@/components/Products/ImportProductsCsvModal";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";
import { Package, Plus, Upload, Loader2, AlertCircle, RefreshCw, Layers, TrendingUp } from "lucide-react";
import type { Product } from "@/data/product-management";
import { productApi } from "@/api/productApi";
import { useToast } from "@/context/GlobalToastContext";
export type { Product };

function SummaryCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{label}</span>
          <span className="mt-1 text-2xl font-bold text-slate-900 leading-none tabular-nums">{value}</span>
        </div>
      </div>
      {sub && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">{sub}</span>
        </div>
      )}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────
   ProductManagement  —  main page
   ───────────────────────────────────────────────────────────────────────── */
export default function ProductManagement() {
  const { showToast } = useToast();

  /* ── Server state ── */
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  /* ── Modal state ── */
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewTarget,   setViewTarget]   = useState<Product | null>(null);
  const [editTarget,   setEditTarget]   = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;

  /* ── Initial fetch ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await productApi.getPage({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
      });
      setProducts(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch {
      setFetchError("Failed to load products. Make sure the backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Debounced server-side search ── */
  useEffect(() => {
    setIsSearching(true);
    const timer = window.setTimeout(() => {
      const typed = searchInput.trim();
      setDebouncedSearch(typed ? `PI${typed}` : "");
      setPage(0);
      setIsSearching(false);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  /* ── Sync the current page snapshot to localStorage ── */
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("products", JSON.stringify(products));
    }
  }, [products, loading]);

  /* ── CRUD handlers ── */
  const handleAdd = useCallback(async (data: Omit<Product, "id">) => {
    try {
      await productApi.create(data);
      setPage(0);
      await fetchProducts();
      showToast("Product added successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to create product.");
    }
  }, [fetchProducts, showToast]);

  const handleEdit = useCallback(async (updated: Product) => {
    try {
      const { id, ...payload } = updated;
      await productApi.update(id, payload);
      await fetchProducts();
      showToast("Product updated successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to update product.");
    }
  }, [fetchProducts, showToast]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await productApi.remove(deleteTarget.id);
      if (products.length === 1 && page > 0) {
        setPage((prev) => Math.max(0, prev - 1));
      } else {
        await fetchProducts();
      }
      showToast("Product deleted successfully!", "success");
    } catch {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error("Failed to delete product.");
    }
  }, [deleteTarget, fetchProducts, page, products.length, showToast]);

  const handleCsvImport = useCallback(async (rows: Omit<Product, "id">[]) => {
    try {
      const result = await productApi.bulkImport(rows);

      if (result.importedCount > 0) {
        setPage(0);
        await fetchProducts();
      }

      if (result.failedCount === 0) {
        showToast(
          `Imported ${result.importedCount} product${result.importedCount === 1 ? "" : "s"} successfully!`,
          "success"
        );
      } else if (result.importedCount > 0) {
        showToast(
          `Imported ${result.importedCount} product${result.importedCount === 1 ? "" : "s"}. ${result.failedCount} row${result.failedCount === 1 ? "" : "s"} failed.`,
          "warning"
        );
      } else {
        showToast("No products were imported. Please review failed rows.", "error");
      }

      return result;
    } catch (error) {
      const message = (error as any)?.response?.data?.message;
      showToast(
        typeof message === "string" && message.trim()
          ? message
          : "CSV import failed. Please try again.",
        "error"
      );
      throw error;
    }
  }, [fetchProducts, showToast]);

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
                  : `${totalElements} product${totalElements !== 1 ? "s" : ""} registered`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Upload size={15} strokeWidth={2.5} />
              Import CSV
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-600 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add New Product
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: "Total Products",
              value: loading ? "—" : totalElements,
              bg: "bg-blue-50",
              text: "text-blue-600",
              icon: Package,
              sub: "Products currently registered",
            },
            {
              label: "Categories",
              value: loading ? "—" : categories,
              bg: "bg-indigo-50",
              text: "text-indigo-600",
              icon: Layers,
              sub: "Unique product categories",
            },
            {
              label: "Avg. Margin",
              value: loading ? "—" : `${avgMargin.toFixed(1)}%`,
              bg: "bg-emerald-50",
              text: "text-emerald-600",
              icon: TrendingUp,
              sub: "Average gross margin percentage",
            },
          ].map((stat) => (
            <SummaryCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconBg={stat.bg}
              iconColor={stat.text}
              sub={stat.sub}
            />
          ))}
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <RefreshLoadingTheme
            title="Loading Products"
            subtitle="Syncing product catalog..."
          />
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
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            searchInput={searchInput}
            isSearching={isSearching}
            onSearchInputChange={setSearchInput}
            onPageChange={(nextPage) => {
              if (nextPage < 0 || nextPage >= Math.max(totalPages, 1)) return;
              setPage(nextPage);
            }}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(0);
            }}
            onView={(p) => setViewTarget(p)}
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
      <ImportProductsCsvModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleCsvImport}
      />
      <ViewProductModal
        isOpen={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        product={viewTarget}
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
