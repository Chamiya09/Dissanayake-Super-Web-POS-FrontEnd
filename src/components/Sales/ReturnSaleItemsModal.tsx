import { useEffect, useMemo, useState } from "react";
import { RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export default function ReturnSaleItemsModal({
  isOpen,
  onClose,
  saleData,
  onConfirm,
  isSubmitting,
}) {
  const [returnInputs, setReturnInputs] = useState({});
  const [error, setError] = useState("");

  const items = useMemo(() => saleData?.items ?? [], [saleData]);

  const itemRows = useMemo(
    () =>
      items.map((item, idx) => {
        const soldQty = toNumber(item.quantity);
        const returnedQty = toNumber(item.returnedQuantity);
        const remainingQty = Math.max(0, soldQty - returnedQty);
        return {
          key: item.id ?? `${item.productId ?? item.productName}-${idx}`,
          saleItemId: item.id,
          productName: item.productName,
          unitPrice: toNumber(item.unitPrice),
          soldQty,
          returnedQty,
          remainingQty,
        };
      }),
    [items]
  );

  const returnableRows = useMemo(
    () => itemRows.filter((row) => row.saleItemId != null && row.remainingQty > 0),
    [itemRows]
  );

  useEffect(() => {
    if (isOpen) {
      setReturnInputs({});
      setError("");
    }
  }, [isOpen, saleData]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !saleData) return null;

  const hasReturnableItems = returnableRows.length > 0;
  const transactionId = saleData.transactionId ?? saleData.receiptNo ?? saleData.id;

  const handleQtyChange = (saleItemId, value) => {
    setReturnInputs((prev) => ({ ...prev, [saleItemId]: value }));
    if (error) setError("");
  };

  const handleSubmit = () => {
    const selectedItems = [];

    for (const row of returnableRows) {
      const raw = returnInputs[row.saleItemId];
      if (raw === "" || raw == null) continue;

      const qty = Number(raw);
      if (!Number.isFinite(qty) || qty < 0) {
        setError("Please enter valid return quantities.");
        return;
      }
      if (qty === 0) continue;
      if (qty > row.remainingQty) {
        setError(`Return quantity for ${row.productName} exceeds available quantity.`);
        return;
      }

      selectedItems.push({
        saleItemId: row.saleItemId,
        quantity: qty,
      });
    }

    if (selectedItems.length === 0) {
      setError("Select at least one item quantity to return.");
      return;
    }

    onConfirm?.({ items: selectedItems });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-sale-items-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 id="return-sale-items-title" className="text-lg font-bold text-slate-900">
                Return Selected Items
              </h2>
              <p className="text-sm text-slate-500">
                Transaction <span className="font-mono font-semibold text-slate-900">{transactionId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {!hasReturnableItems ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              All items in this sale have already been returned.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Product</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Already Returned</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Remaining</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnableRows.map((row) => {
                    return (
                      <tr key={row.key} className={cn("transition-colors hover:bg-slate-50")}>
                        <td className="px-4 py-3 font-medium text-slate-900">{row.productName}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.soldQty}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{row.returnedQty}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{row.remainingQty}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatCurrency(row.unitPrice)}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={0.001}
                            max={row.remainingQty}
                            disabled={isSubmitting}
                            value={returnInputs[row.saleItemId] ?? ""}
                            onChange={(e) => handleQtyChange(row.saleItemId, e.target.value)}
                            className="h-9 text-right tabular-nums"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasReturnableItems}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isSubmitting ? "Processing..." : "Process Return"}
          </Button>
        </div>
      </div>
    </div>
  );
}
