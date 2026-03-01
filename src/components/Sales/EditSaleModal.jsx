import { useState, useEffect } from "react";
import { ReceiptText, X, User, CreditCard, Banknote, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   EditSaleModal
   Read-only ledger entry editor — lets staff correct Payment Method,
   Customer Name, or Total Amount on a recorded sale.
   No API calls: operates entirely on frontend mock data via onSave().
   ───────────────────────────────────────────────────────────────────────── */

const PAYMENT_METHODS = ["Cash", "Card"];

const EMPTY_FORM = {
  customerName:   "",
  paymentMethod:  "Cash",
  totalAmount:    "",
};

function validate(form) {
  const err = {};
  if (!form.customerName.trim()) {
    err.customerName = "Customer name is required.";
  }
  if (!form.paymentMethod) {
    err.paymentMethod = "Payment method is required.";
  }
  const amt = Number(form.totalAmount);
  if (!form.totalAmount || isNaN(amt) || amt <= 0) {
    err.totalAmount = "Enter a valid amount greater than 0.";
  }
  return err;
}

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
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* Pre-fill whenever a sale is targeted */
  useEffect(() => {
    if (isOpen && saleData) {
      setForm({
        customerName:  saleData.customerName ?? "",
        paymentMethod: saleData.paymentMethod ?? "Cash",
        totalAmount:   saleData.totalAmount != null ? String(saleData.totalAmount) : "",
      });
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

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = () => {
    const err = validate(form);
    if (Object.keys(err).length) { setErrors(err); return; }
    if (!saleData) return;

    setSaving(true);
    /* Simulate a brief async operation (swap for real API call in future) */
    setTimeout(() => {
      onSave?.({
        ...saleData,
        customerName:  form.customerName.trim(),
        paymentMethod: form.paymentMethod,
        totalAmount:   Number(form.totalAmount),
      });
      setSaving(false);
      onClose();
    }, 400);
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
          "relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl",
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
                Updating record{" "}
                <span className="font-mono font-semibold text-foreground">
                  {saleData.id}
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
        <div className="space-y-4 px-6 py-5">

          {/* Customer Name — full width */}
          <FormRow id="edit-customerName" label="Customer Name" icon={User} error={errors.customerName}>
            <Input
              id="edit-customerName"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              placeholder="e.g. Kamal Perera"
              className={cn(
                "h-10 text-[13px]",
                errors.customerName && "border-red-400 focus-visible:ring-red-400"
              )}
            />
          </FormRow>

          {/* Payment Method + Total Amount — side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Payment Method dropdown */}
            <FormRow id="edit-paymentMethod" label="Payment Method" icon={CreditCard} error={errors.paymentMethod}>
              <div className="relative">
                {/* Indicator dot */}
                <span
                  className={cn(
                    "pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full",
                    form.paymentMethod === "Card" ? "bg-blue-500" : "bg-emerald-500"
                  )}
                />
                <select
                  id="edit-paymentMethod"
                  value={form.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                  className={cn(
                    "h-10 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-3 text-[13px] text-foreground shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                    "transition-colors",
                    errors.paymentMethod && "border-red-400 focus:ring-red-400"
                  )}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </FormRow>

            {/* Total Amount */}
            <FormRow id="edit-totalAmount" label="Total Amount (LKR)" icon={DollarSign} error={errors.totalAmount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">
                  Rs.
                </span>
                <Input
                  id="edit-totalAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.totalAmount}
                  onChange={(e) => set("totalAmount", e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    "h-10 pl-9 text-[13px]",
                    errors.totalAmount && "border-red-400 focus-visible:ring-red-400"
                  )}
                />
              </div>
            </FormRow>
          </div>

          {/* Payment method visual hint */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[12px]",
              form.paymentMethod === "Card"
                ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
            )}
          >
            {form.paymentMethod === "Card"
              ? <CreditCard className="h-3.5 w-3.5 shrink-0" />
              : <Banknote className="h-3.5 w-3.5 shrink-0" />}
            <span>
              {form.paymentMethod === "Card"
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
