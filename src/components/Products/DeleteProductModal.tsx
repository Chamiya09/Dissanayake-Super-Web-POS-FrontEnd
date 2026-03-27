import { useState, useEffect } from "react";
import { X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";

/* ─────────────────────────────────────────────────────────────────────────
   DeleteProductModal
   Mirrors DeleteConfirmModal from the Supplier module exactly:
     • bg-black/50 backdrop-blur-sm overlay
     • max-w-md rounded-2xl bg-card shadow-2xl panel
     • Centred warning icon with ring-8 ring-red-500/5
     • Detail chip showing product info
     • outline Cancel + red-600 Delete buttons in border-t footer
   ───────────────────────────────────────────────────────────────────────── */

export interface DeleteProductModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  product:   Product | null;
  onConfirm: () => void;           // called ONLY after the user clicks Delete
}

export function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: DeleteProductModalProps) {
  const [deleting, setDeleting] = useState(false);

  /* Reset spinner every time the modal opens */
  useEffect(() => {
    if (isOpen) setDeleting(false);
  }, [isOpen]);

  /* Close on Escape (disabled while deletion is in-flight) */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, deleting, onClose]);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      // error handled by parent
    } finally {
      if (isOpen) setDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    /* ── Full-screen backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="delete-product-title"
    >
      {/* Dimmed overlay — blocked while deleting */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!deleting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Absolute close button (top-right) */}
        <button
          onClick={onClose}
          disabled={deleting}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-muted hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Body ── */}
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">

          {/* Warning icon with ring — matches Supplier DeleteConfirmModal */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-500/5">
            <AlertTriangle className="h-8 w-8" />
          </div>

          {/* Heading + description */}
          <div className="space-y-1.5">
            <h2
              id="delete-product-title"
              className="text-[18px] font-bold text-foreground"
            >
              Delete Product?
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{product.productName}</span>?
              This action cannot be undone.
            </p>
          </div>

          {/* Product detail chip */}
          <div className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-left space-y-1">
            <p className="text-[12px] font-semibold text-slate-800">{product.productName}</p>
            <p className="text-[11px] text-muted-foreground">
              {product.id}&nbsp;&middot;&nbsp;SKU:&nbsp;{product.sku}&nbsp;&middot;&nbsp;{product.category}
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl px-6 py-4">
          <button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>

          {/* Destructive confirm button */}
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-all focus:ring-2 focus:ring-red-600 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
