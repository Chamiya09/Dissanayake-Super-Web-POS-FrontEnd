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
import { showSuccess, showError } from "@/utils/toastUtils";

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value }: { icon: any, iconBg: string, iconColor: string, label: string, value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
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
      showSuccess("Supplier added successfully!");
    } catch (err) {
      showError("Something went wrong. Please try again.");
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers]);

  /* ── PUT ── */
  const handleEdit = useCallback(async (updated: Supplier) => {
    try {
      const { id, createdAt: _createdAt, ...payload } = updated;
      await supplierApi.update(id, payload);
      await fetchSuppliers();
      showSuccess("Supplier updated successfully!");
    } catch (err) {
      showError("Something went wrong. Please try again.");
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
      showSuccess("Supplier deleted successfully!");
    } catch (err) {
      showError("Something went wrong. Please try again.");
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
        showSuccess("Products assigned successfully!");
      } catch (err) {
        showError("Something went wrong. Please try again.");
        throw new Error(extractApiError(err));
      }
    },
    [assignTarget],
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <AppHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Supplier Management
                </h1>
              </div>
              <p className="text-sm text-slate-500 mt-1 ml-11">
                {loading
                  ? "Loading supplier network..."
                  : `Manage your supplier network · ${suppliers.length} active supplier${suppliers.length !== 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSuppliers}
                disabled={loading}
                title="Refresh List"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              
              <Button
                onClick={() => setIsAddOpen(true)}
                className="h-10 px-5 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-medium transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Supplier</span>
              </Button>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
             {/* 
                We assume SupplierTable internally handles the table structure.
                Ideally, it should render distinct <thead> and <tbody> consistent with the theme.
                If SupplierTable is rigid, the container above at least ensures it fits the card style.
             */}
            <div className="p-0">
              <SupplierTable
            suppliers={suppliers}
            onEdit={(s) => setEditTarget(s)}
            onDelete={(s) => setDeleteTarget(s)}
            onAssign={(s) => setAssignTarget(s)}
            onViewProducts={(s) => setViewTarget(s)}
          />            </div>
          </div>        </div>
      </div>

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
