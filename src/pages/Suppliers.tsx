import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { SupplierTable } from "@/components/Suppliers/SupplierTable";
import { AddSupplierModal } from "@/components/Suppliers/AddSupplierModal";
import { EditSupplierModal } from "@/components/Suppliers/EditSupplierModal";
import { DeleteConfirmModal } from "@/components/Suppliers/DeleteConfirmModal";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Supplier } from "@/data/suppliers";

export default function Suppliers() {
  const [addOpen, setAddOpen]           = useState(false);
  const [editTarget, setEditTarget]     = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">Suppliers</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your product suppliers and lead times.
              </p>
            </div>
          </div>

          <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Supplier</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Table */}
        <SupplierTable
          onEdit={(s) => setEditTarget(s)}
          onDelete={(s) => setDeleteTarget(s)}
        />
      </div>

      {/* Modals */}
      <AddSupplierModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
      />
      <EditSupplierModal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        supplier={editTarget}
      />
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        supplier={deleteTarget}
      />
    </div>
  );
}
