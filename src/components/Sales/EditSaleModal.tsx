import { useState, useEffect, useMemo } from "react";
import { ReceiptText, X, CreditCard, Banknote, DollarSign, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/utils/formatCurrency";

/* ─────────────────────────────────────────────────────────────────────────
   EditSaleModal
   Full sale editor — lets staff correct Payment Method and individual
   line-item unit prices. Sends PUT /api/sales/:id with full item list.
   ───────────────────────────────────────────────────────────────────────── */

const PAYMENT_METHODS = ["Cash", "Card"];

/* ── Reusable labelled form row ── */
function FormRow({ id, label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11.5px] font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────── */
export default function EditSaleModal({ isOpen, onClose, saleData, onSave }) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* Pre-fill whenever a sale is targeted */
  useEffect(() => {
    if (isOpen && saleData) {
      setPaymentMethod(saleData.paymentMethod ?? "Cash");
      setItems(
        (saleData.items ?? []).map((item) => ({
          productId:   item.productId ?? null,
          productName: item.productName ?? "",
          quantity:    item.quantity ?? 0,
          unitPrice:   String(item.unitPrice ?? item.price ?? 0),
        }))
      );
      setErrors({});
      setSaving(false);
    }
  }, [isOpen, saleData]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* Derived totals — recalculated whenever items state changes */
  const computedItems = useMemo(
    () =>
      items.map((it) => {
        const price = Number(it.unitPrice) || 0;
        const qty   = Number(it.quantity)  || 0;
        return { ...it, lineTotal: qty * price };
      }),
    [items]
  );

  const grandTotal = useMemo(
    () => computedItems.reduce((sum, it) => sum + it.lineTotal, 0),
    [computedItems]
  );

  /* Update unit price for a specific item */
  const setItemPrice = (index, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, unitPrice: value } : it)));
    if (errors[`itemPrice_${index}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`itemPrice_${index}`];
        return next;
      });
    }
  };

  /* Validation */
  const validate = () => {
    const err = {};
    items.forEach((it, i) => {
      const price = Number(it.unitPrice);
      if (isNaN(price) || price <= 0) {
        err[`itemPrice_${i}`] = "Price must be a positive value.";
      }
    });
    if (items.length === 0) {
      err.items = "Sale must have at least one item.";
    }
    return err;
  };

  /* Save — calls PUT /api/sales/:id with the SaleUpdateRequest shape */
  const handleSave = async () => {
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    if (!saleData) return;

    setSaving(true);
    try {
      const payload = {
        paymentMethod,
        totalAmount: grandTotal,
        items: computedItems.map((it) => ({
          productId:   it.productId,
          productName: it.productName,
          quantity:    it.quantity,
          unitPrice:   Number(it.unitPrice),
          lineTotal:   it.lineTotal,
        })),
      };

      console.log("[EditSaleModal] PUT payload:", JSON.stringify(payload, null, 2));
      const response = await api.put(`/api/sales/${saleData.id}`, payload);
      onSave?.(response.data);
      onClose();
    } catch (err) {
      console.error("Failed to update sale:", err);
      const data = err?.response?.data;
      console.error("[EditSaleModal] Error response body:", data);
      const msg = data?.detail || data?.message || data?.error || "Failed to update sale. Please try again.";
      setErrors({ api: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !saleData) return null;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-sale-title"
    >
      {/* Dimmed overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="h-[18px] w-[18px]" />
            </div>
            <div>
              <h2
                id="edit-sale-title"
                className="text-[16px] font-bold leading-tight text-foreground"
              >
                Edit Sale
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Updating{" "}
                <span className="font-mono font-semibold text-foreground">
                  {saleData.receiptNo}
                </span>
              </p>
            </div>
          </div>

          {/* Close × */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Form body ── */}
        <div className="space-y-4 px-6 py-5 max-h-[60vh] overflow-y-auto">

          {/* API error banner */}
          {errors.api && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-700">
              {errors.api}
            </div>
          )}

          {/* Payment Method */}
          <FormRow id="edit-paymentMethod" label="Payment Method" icon={CreditCard} error={errors.paymentMethod}>
            <div className="relative">
              <span
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
                  paymentMethod === "Card" ? "bg-blue-500" : "bg-emerald-500"
                )}
              />
              <select
                id="edit-paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className={cn(
                  "h-10 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-3 text-[13px] text-foreground shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                  "transition-colors"
                )}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </FormRow>

          {/* ── Line Items ── */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Line Items
            </label>
            {errors.items && (
              <p className="text-[11.5px] font-medium text-red-500">{errors.items}</p>
            )}

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Product</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-16">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground w-28">Unit Price</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {computedItems.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-[13px] font-medium text-foreground">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[13px] tabular-nums text-muted-foreground">
                        {Number(item.quantity).toFixed(item.quantity % 1 === 0 ? 0 : 3)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={items[idx]?.unitPrice ?? ""}
                          onChange={(e) => setItemPrice(idx, e.target.value)}
                          className={cn(
                            "h-8 w-full text-right text-[13px] tabular-nums",
                            errors[`itemPrice_${idx}`] && "border-red-400 focus-visible:ring-red-400"
                          )}
                        />
                        {errors[`itemPrice_${idx}`] && (
                          <p className="mt-0.5 text-[10px] font-medium text-red-500">
                            {errors[`itemPrice_${idx}`]}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-foreground">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Grand Total
            </span>
            <span className="text-[16px] font-bold tabular-nums text-foreground">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          {/* Payment method visual hint */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px]",
              paymentMethod === "Card"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            )}
          >
            {paymentMethod === "Card"
              ? <CreditCard className="h-3.5 w-3.5 shrink-0" />
              : <Banknote className="h-3.5 w-3.5 shrink-0" />}
            <span>
              {paymentMethod === "Card"
                ? "Card payment — bank/debit card transaction."
                : "Cash payment — physical currency received."}
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 text-[13px] gap-2 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
