import { useEffect, useState } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Supplier } from "@/data/suppliers";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({ isOpen, onClose, supplier, onConfirm }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* Reset state every time the modal opens */
  useEffect(() => {
    if (isOpen) { setDeleting(false); setApiError(null); }
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setApiError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete supplier.");
      setDeleting(false);
    }
  };

  if (!isOpen || !supplier) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-supplier-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!deleting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-slate-100 bg-white shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={deleting}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Body */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
          {/* Warning icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
            <AlertTriangle className="h-8 w-8" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h2
              id="delete-supplier-title"
              className="text-[18px] font-bold text-slate-900"
            >
              Delete Supplier?
            </h2>
            <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">{supplier.companyName}</span>?
              This action cannot be undone.
            </p>
          </div>

          {/* Supplier detail chip */}
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left space-y-1">
            <p className="text-[12px] font-semibold text-slate-900">{supplier.companyName}</p>
            <p className="text-[11px] text-slate-500">
              {supplier.id} &middot; {supplier.contactPerson} &middot; {supplier.phone}
            </p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {apiError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className={cn(
              "h-9 px-5 text-[13px] gap-2 shadow-sm",
              "bg-red-600 text-white hover:bg-red-700",
              "focus-visible:ring-red-500"
            )}
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Confirm Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
