import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { AssignProductsModal, type MgmtProduct } from "@/components/Suppliers/AssignProductsModal";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Supplier } from "@/data/suppliers";
import { supplierApi } from "@/lib/supplierApi";
import api from "@/lib/axiosInstance";

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

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;
  const isAssignOpen = assignTarget !== null;

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
      .get<MgmtProduct[]>("/api/products")
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
    } catch (err) {
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers]);

  /* ── PUT ── */
  const handleEdit = useCallback(async (updated: Supplier) => {
    try {
      const { id, createdAt: _createdAt, ...payload } = updated;
      await supplierApi.update(id, payload);
      await fetchSuppliers();
    } catch (err) {
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
    } catch (err) {
      throw new Error(extractApiError(err));
    }
  }, [deleteTarget, fetchSuppliers]);

  /* ── ASSIGN products to a supplier ── */
  const handleAssign = useCallback(
    async (productIds: number[]) => {
      if (!assignTarget) return;
      try {
        await supplierApi.assignProducts(assignTarget.id, productIds);
        setAssignTarget(null);
      } catch (err) {
        throw new Error(extractApiError(err));
      }
    },
    [assignTarget],
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50/50">
      <AppHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="w-full px-8 py-8 space-y-7">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">
                Supplier Management
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {loading
                  ? "Loading…"
                  : `Manage your supplier network · ${suppliers.length} supplier${suppliers.length !== 1 ? "s" : ""} registered`}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={fetchSuppliers}
                disabled={loading}
                title="Refresh"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Supplier</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Stats strip ── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Suppliers",  value: suppliers.length },
              { label: "AI Auto-Reorder",  value: suppliers.filter((s) => s.isAutoReorderEnabled).length },
              { label: "Slow (> 5 days)",  value: suppliers.filter((s) => s.leadTime > 5).length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm">
                <p className="text-3xl font-bold text-slate-900 tabular-nums">{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-1.5 font-semibold uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ── Table ── */}
          <SupplierTable
            suppliers={suppliers}
            onEdit={(s) => setEditTarget(s)}
            onDelete={(s) => setDeleteTarget(s)}
            onAssign={(s) => setAssignTarget(s)}
          />
        </div>
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
    </div>
  );
}
