import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { AssignProductsModal, type MgmtProduct } from "@/components/Suppliers/AssignProductsModal";
import { ViewAssignedProductsModal } from "@/components/Suppliers/ViewAssignedProductsModal";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";
import { PlusCircle, RefreshCw, Building2, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Supplier } from "@/data/suppliers";
import { supplierApi } from "@/lib/supplierApi";
import api from "@/lib/axiosInstance";
import { useToast } from "@/context/GlobalToastContext";

function SummaryCard({
  icon: Icon,
  surface,
  iconTone,
  valueTone,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  surface: string;
  iconTone: string;
  valueTone: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${surface} ${iconTone}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className={`block text-3xl font-bold leading-none ${valueTone}`}>{value}</span>
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

function buildSupplierDeleteError(err: unknown): { title: string; message: string } {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    const raw = String(data?.message ?? data?.detail ?? "").toLowerCase();

    if (status === 404) {
      return {
        title: "Supplier Not Found",
        message: "This supplier was not found. Refresh and try again.",
      };
    }

    if (status === 409 || status === 400) {
      if (raw.includes("assigned") || raw.includes("product")) {
        return {
          title: "Delete Blocked",
          message: "This supplier has assigned products. Unassign them first, then delete.",
        };
      }

      if (raw.includes("stock") || raw.includes("inventory")) {
        return {
          title: "Delete Blocked",
          message: "This supplier still has active inventory or stock references. Clear them first, then delete.",
        };
      }
    }

    if (status === 500) {
      return {
        title: "Server Error",
        message: "Could not delete supplier right now. Please try again in a moment.",
      };
    }
  }

  return {
    title: "Delete Failed",
    message: extractApiError(err),
  };
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
  const handleAdd = useCallback(async (data: Omit<Supplier, "id" | "supplierCode" | "createdAt" | "isActive">) => {
    try {
      await supplierApi.create(data);
      await fetchSuppliers();
      showToast("Supplier added successfully!", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers, showToast]);

  const handleToggleActive = useCallback(async (supplier: Supplier, isActive: boolean) => {
    setSuppliers((prev) =>
      prev.map((item) => (item.id === supplier.id ? { ...item, isActive } : item))
    );

    try {
      const updated = await supplierApi.updateStatus(supplier.id, isActive);
      setSuppliers((prev) =>
        prev.map((item) => (item.id === supplier.id ? updated : item))
      );
      showToast(
        `${supplier.companyName} ${isActive ? "enabled" : "disabled"} successfully.`,
        "success"
      );
    } catch (err) {
      setSuppliers((prev) =>
        prev.map((item) => (item.id === supplier.id ? { ...item, isActive: supplier.isActive } : item))
      );
      showToast(extractApiError(err), "error");
    }
  }, [showToast]);

  /* ── PUT ── */
  const handleEdit = useCallback(async (updated: Supplier) => {
    try {
      const { id, supplierCode: _supplierCode, createdAt: _createdAt, isActive: _isActive, ...payload } = updated;
      await supplierApi.update(id, payload);
      await fetchSuppliers();
      showToast("Supplier updated successfully!", "success");
    } catch (err) {
      showToast("Something went wrong. Please try again.", "error");
      throw new Error(extractApiError(err));
    }
  }, [fetchSuppliers, showToast]);

  /* ── DELETE ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await supplierApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await fetchSuppliers();
      showToast("Supplier deleted successfully!", "success");
    } catch (err) {
      const { title, message } = buildSupplierDeleteError(err);
      showToast({ type: "error", title, message });
      throw new Error(message);
    }
  }, [deleteTarget, fetchSuppliers, showToast]);

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
    [assignTarget, showToast],
  );

  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const slowSuppliers = suppliers.filter((s) => s.leadTime > 5).length;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {loading && (
          <RefreshLoadingTheme
            title="Loading Suppliers"
            subtitle="Syncing supplier network..."
          />
        )}

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
                    : `Manage your supplier network · ${activeSuppliers} active of ${suppliers.length} supplier${suppliers.length !== 1 ? "s" : ""}`}
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
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-teal-600 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 shrink-0"
              >
                <PlusCircle size={16} strokeWidth={2.5} />
                Add Supplier
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
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SummaryCard
                icon={Building2}
                surface="bg-slate-100"
                iconTone="text-slate-600"
                valueTone="text-slate-900"
                label="Total Suppliers"
                value={suppliers.length}
                sub="registered"
              />
              <SummaryCard
                icon={Truck}
                surface="bg-teal-50"
                iconTone="text-teal-600"
                valueTone="text-teal-700"
                label="Active Suppliers"
                value={activeSuppliers}
                sub="currently enabled"
              />
              <SummaryCard
                icon={Clock}
                surface="bg-amber-50"
                iconTone="text-amber-600"
                valueTone={slowSuppliers > 0 ? "text-amber-700" : "text-slate-900"}
                label="Slow Deliveries"
                value={slowSuppliers}
                sub="over 5 days"
              />
            </div>
          </div>

          {/* ── Main content ── */}
          <SupplierTable
            suppliers={suppliers}
            onEdit={(s) => setEditTarget(s)}
            onDelete={(s) => setDeleteTarget(s)}
            onAssign={(s) => setAssignTarget(s)}
            onViewProducts={(s) => setViewTarget(s)}
            onToggleActive={handleToggleActive}
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
