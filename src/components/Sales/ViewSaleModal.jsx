import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatCurrency";

/* ── Dashed separator ── */
const Dash = () => (
  <div className="my-2.5 border-t border-dashed border-neutral-300 dark:border-neutral-600" />
);

export default function ViewSaleModal({ isOpen, onClose, saleData }) {
  if (!isOpen || !saleData) return null;

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const { date, time } = formatDateTime(saleData.dateTime);
  const isCard  = saleData.paymentMethod === "Card";
  const isVoid  = saleData.status === "Void";

  /* Derive subtotal/tax from actual items when available */
  const lineItems = Array.isArray(saleData.items) && saleData.items.length > 0 ? saleData.items : null;
  const subtotal  = lineItems ? lineItems.reduce((sum, i) => sum + (i.quantity ?? i.qty ?? 0) * (i.price ?? i.unitPrice ?? 0), 0) : null;
  const tax       = subtotal !== null ? saleData.totalAmount - subtotal : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* ── Modal chrome header ── */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Printer className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Sale Receipt</h2>
              <p className="text-[11px] text-muted-foreground">{saleData.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Paper receipt body ── */}
        <div className="max-h-[65vh] overflow-y-auto bg-neutral-50 px-6 py-5 dark:bg-neutral-900">
          <div className="font-mono text-[12.5px] leading-relaxed text-neutral-800 dark:text-neutral-200">

            {/* Store header */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                *** OFFICIAL RECEIPT ***
              </p>
              <p className="mt-1 text-[17px] font-bold tracking-widest">DISSANAYAKE SUPER</p>
              <p className="text-[11px] text-neutral-500">No. 45, Main Street, Colombo 07</p>
              <p className="text-[11px] text-neutral-500">Tel: +94 11 234 5678</p>
              <p className="text-[11px] text-neutral-500">VAT Reg: 114-456-7890</p>
            </div>

            <Dash />

            {/* Receipt metadata */}
            <div className="space-y-0.5 text-[12px]">
              <MetaRow label="Receipt No" value={saleData.id} bold />
              <MetaRow label="Date"       value={date} />
              <MetaRow label="Time"       value={time} />
              <MetaRow
                label="Payment"
                value={saleData.paymentMethod}
                valueClass={isCard ? "font-semibold text-blue-600" : "font-semibold text-emerald-600"}
              />
              {isVoid && (
                <MetaRow label="Status" value="** VOID **" valueClass="font-bold text-red-500" />
              )}
            </div>

            <Dash />

            {/* Items mini-table */}
            <table className="mt-1 w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-neutral-400">
                  <th className="pb-1 text-left font-normal w-[40%]">Item</th>
                  <th className="pb-1 text-center font-normal w-[10%]">Qty</th>
                  <th className="pb-1 text-right font-normal w-[25%]">Price</th>
                  <th className="pb-1 text-right font-normal w-[25%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems ? (
                  lineItems.map((item, i) => {
                    const qty   = item.quantity ?? item.qty ?? 0;
                    const price = item.price ?? item.unitPrice ?? 0;
                    const lineTotal = qty * price;
                    return (
                      <tr key={i} className="align-top">
                        <td className="py-0.5 pr-1 text-neutral-700 dark:text-neutral-200 leading-snug">{item.name}</td>
                        <td className="py-0.5 text-center text-neutral-500">{qty}</td>
                        <td className="py-0.5 text-right text-neutral-500">{formatCurrency(price)}</td>
                        <td className="py-0.5 text-right font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center italic text-neutral-400">
                      No items recorded for this sale.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Dash />

            {/* Subtotals — only shown when items are available */}
            {subtotal !== null && (
              <div className="space-y-0.5 text-[12px] text-neutral-500">
                <MetaRow label="Subtotal" value={formatCurrency(subtotal)} />
                {tax !== null && tax > 0 && (
                  <MetaRow label="Tax / Discount" value={formatCurrency(tax)} />
                )}
              </div>
            )}

            {/* Heavy rule before grand total */}
            <div className="my-2 border-t-2 border-neutral-400 dark:border-neutral-500" />

            <div className="flex justify-between text-[14px] font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(saleData.totalAmount)}</span>
            </div>

            <Dash />

            {/* Footer note */}
            <div className="text-center text-[11px] leading-5 text-neutral-400">
              <p>Goods once sold are not returnable.</p>
              <p>Thank you for shopping with us!</p>
              <p className="mt-1 tracking-widest">*** THANK YOU COME AGAIN ***</p>
            </div>

          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2 border-t border-border bg-card px-5 py-4">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}

/* ── helper: single metadata row ── */
function MetaRow({ label, value, bold = false, valueClass = "" }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-neutral-400">{label}</span>
      <span className={bold ? `font-bold ${valueClass}` : valueClass || "text-neutral-700 dark:text-neutral-300"}>
        {value}
      </span>
    </div>
  );
}
