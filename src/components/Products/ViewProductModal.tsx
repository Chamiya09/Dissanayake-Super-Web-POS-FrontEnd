import Barcode from "react-barcode";
import { Package, X, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";

export interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ViewProductModal({ isOpen, onClose, product }: ViewProductModalProps) {
  if (!isOpen || !product) return null;

  const barcodeValue = (product.barcode ?? "").trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="view-product-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
              <Package size={20} />
            </div>
            <div>
              <h2 id="view-product-title" className="text-base font-bold text-slate-800 leading-tight">
                Product Details
              </h2>
              <p className="text-[12px] text-sm text-slate-500 mt-1">Visual barcode preview</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-muted hover:text-accent-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Product</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{product.productName}</p>
            <p className="mt-1 text-xs text-slate-500">Category: {product.category}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Barcode</p>
            </div>

            {barcodeValue ? (
              <div className="flex flex-col items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-4">
                <Barcode
                  value={barcodeValue}
                  height={56}
                  width={1.6}
                  fontSize={14}
                  margin={0}
                  displayValue
                  background="transparent"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">
                No barcode is attached to this product.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
