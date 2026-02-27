import { useState, useCallback } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { AssignProductsModal } from "@/components/Suppliers/AssignProductsModal";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suppliers as initialSuppliers, type Supplier } from "@/data/suppliers";

/* ── Generate a simple incremental ID ── */
let nextIdCounter = initialSuppliers.length + 1;
const generateId = () => {
  const id = `SUP-${String(nextIdCounter).padStart(3, "0")}`;
  nextIdCounter++;
  return id;
};

export default function Suppliers() {
  /* ── Master list (single source of truth) ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

  /* ── Modal visibility / target state ── */
  const [isAddOpen, setIsAddOpen]         = useState(false);
  const [editTarget, setEditTarget]       = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Supplier | null>(null);
  const [assignTarget, setAssignTarget]   = useState<Supplier | null>(null);

  const isEditOpen   = editTarget   !== null;
  const isDeleteOpen = deleteTarget !== null;
  const isAssignOpen = assignTarget !== null;

  /* ── CRUD handlers ── */
  const handleAdd = useCallback((data: Omit<Supplier, "id">) => {
    const newSupplier: Supplier = { id: generateId(), ...data };
    setSuppliers((prev) => [...prev, newSupplier]);
  }, []);

  const handleEdit = useCallback((updated: Supplier) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
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
                {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New Supplier</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Suppliers",    value: suppliers.length },
            { label: "Fast (≤ 1 day)",     value: suppliers.filter((s) => s.leadTime <= 1).length },
            { label: "Slow (> 3 days)",    value: suppliers.filter((s) => s.leadTime > 3).length },
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
