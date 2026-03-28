import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { AssignProductsModal, type MgmtProduct } from "@/components/Suppliers/AssignProductsModal";
import { ViewAssignedProductsModal } from "@/components/Suppliers/ViewAssignedProductsModal";
import { Plus, RefreshCw, Building2, Zap, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Supplier } from "@/data/suppliers";
import { supplierApi } from "@/lib/supplierApi";
import api from "@/lib/axiosInstance";
import { useToast } from "@/context/GlobalToastContext";

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value }: { icon: any, iconBg: string, iconColor: string, label: string, value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{label}</span>
          <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{value}</span>
        </div>
      </div>
    </div>
  );
}

/** Converts an AxiosError or plain Error into a user-readable string. */
function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    return (
      data?.message ??
      data?.detail ??
      `Server error (${err.response?.status ?? "unknown"})`
    );
  }
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

export default function Suppliers() {
  const { showToast } = useToast();
  /* ── Supplier list & async state ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  /* ── Product list (fetched once for the Assign modal) ── */
  const [availableProducts, setAvailableProducts] = useState<MgmtProduct[]>([]);
  const [productsLoading, setProductsLoading]     = useState(false);

  /* ── Modal visibility / target state ── */
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [assignTarget, setAssignTarget] = useState<Supplier | null>(null);
  const [viewTarget, setViewTarget]     = useState<Supplier | null>(null);

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;
  const isAssignOpen = assignTarget !== null;
  const isViewOpen   = viewTarget   !== null;

  /* ── Load suppliers from API ── */
  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierApi.getAll();
      setSuppliers(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const serverMsg = err.response?.data?.message ?? err.response?.data?.detail;
        setError(serverMsg ?? "Unable to connect to the server. Please check your connection.");
      } else {
        setError("Unable to connect to the server. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  /* ── Fetch real products from /api/products ── */
  useEffect(() => {
    setProductsLoading(true);
    api
      .get<MgmtProduct[]>("/api/products/unassigned")
      .then((r) => setAvailableProducts(r.data))
      .catch(() => {
        // Non-fatal: the assign modal will just show an empty state
        setAvailableProducts([]);
      })
      .finally(() => setProductsLoading(false));
  }, []);

  /* ── POST ── */
  const handleAdd = useCallback(async (data: Omit<Supplier, "id" | "createdAt">) => {
    try {
      await supplierApi.create(data);
      await fetchSuppliers();
      showToast("Supplier added successfully!", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers]);

  /* ── PUT ── */
  const handleEdit = useCallback(async (updated: Supplier) => {
    try {
      const { id, createdAt: _createdAt, ...payload } = updated;
      await supplierApi.update(id, payload);
      await fetchSuppliers();
      showToast("Supplier updated successfully!", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers]);

  /* ── DELETE ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await supplierApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await fetchSuppliers();
      showToast("Supplier deleted successfully!", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error(extractApiError(err));
    }
  }, [deleteTarget, fetchSuppliers]);

  /* ── ASSIGN products to a supplier ── */
  const handleAssign = useCallback(
    async (productIds: number[]) => {
      if (!assignTarget) return;
      try {
        await supplierApi.assignProducts(assignTarget.id, productIds);
        setAvailableProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
        setAssignTarget(null);
        showToast("Products assigned successfully!", "success");
      } catch (err) {
        showToast("Something went wrong. Please try again.", "error");
        throw new Error(extractApiError(err));
      }
    },
    [assignTarget],
  );

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-none py-8 space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Supplier Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {loading
                    ? "Loading supplier network..."
                    : `Manage your supplier network · ${suppliers.length} active supplier${suppliers.length !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSuppliers}
                disabled={loading}
                title="Refresh List"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-100 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-600 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-4 sm:px-6 lg:px-8">
            <SummaryCard 
              icon={Truck}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
              label="Total Suppliers"
              value={suppliers.length}
            />
            <SummaryCard 
              icon={Zap}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              label="AI Auto-Reorder"
              value={suppliers.filter((s) => s.isAutoReorderEnabled).length}
            />
            <SummaryCard 
              icon={Clock}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              label="Slow Delivery (> 5 Days)"
              value={suppliers.filter((s) => s.leadTime > 5).length}
            />
          </div>

          {/* ── Main content ── */}
          <SupplierTable
            suppliers={suppliers}
            onEdit={(s) => setEditTarget(s)}
            onDelete={(s) => setDeleteTarget(s)}
            onAssign={(s) => setAssignTarget(s)}
            onViewProducts={(s) => setViewTarget(s)}
          />        </div>
        </main>

        {/* ── Modals ── */}
      <AddSupplierModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleAdd}
      />
      <EditSupplierModal
        isOpen={isEditOpen}
        onClose={() => setEditTarget(null)}
        supplier={editTarget}
        onSave={handleEdit}
      />
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setDeleteTarget(null)}
        supplier={deleteTarget}
        onConfirm={handleDelete}
      />
      <AssignProductsModal
        isOpen={isAssignOpen}
        onClose={() => setAssignTarget(null)}
        supplier={assignTarget}
        availableProducts={availableProducts}
        productsLoading={productsLoading}
        onAssign={handleAssign}
      />
      <ViewAssignedProductsModal
        isOpen={isViewOpen}
        onClose={() => setViewTarget(null)}
        supplier={viewTarget}
        onProductUnassigned={(product) =>
          setAvailableProducts((prev) => [...prev, product])
        }
      />
    </div>
  );
}
