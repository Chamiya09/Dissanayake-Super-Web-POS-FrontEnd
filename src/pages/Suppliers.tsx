import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { AssignProductsModal } from "@/components/Suppliers/AssignProductsModal";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Supplier } from "@/data/suppliers";
import { supplierApi } from "@/lib/supplierApi";

export default function Suppliers() {
  /* ── Master list & async state ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

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

  /* ── POST ── */
  const handleAdd = useCallback(async (data: Omit<Supplier, "id" | "createdAt">) => {
    const created = await supplierApi.create(data);
    setSuppliers((prev) => [...prev, created]);
  }, []);

  /* ── PUT ── */
  const handleEdit = useCallback(async (updated: Supplier) => {
    const { id, createdAt, ...payload } = updated;
    const saved = await supplierApi.update(id, payload);
    setSuppliers((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
  }, []);

  /* ── DELETE ── */
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await supplierApi.remove(deleteTarget.id);
    setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
  }, [deleteTarget]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                Supplier Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {loading
                  ? "Loading…"
                  : `${suppliers.length} supplier${suppliers.length !== 1 ? "s" : ""} registered`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchSuppliers}
              disabled={loading}
              title="Refresh"
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add New Supplier</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Suppliers", value: suppliers.length },
            { label: "AI Auto-Reorder", value: suppliers.filter((s) => s.isAutoReorderEnabled).length },
            { label: "Slow (> 5 days)", value: suppliers.filter((s) => s.leadTime > 5).length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[22px] font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
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
      />
    </div>
  );
}
