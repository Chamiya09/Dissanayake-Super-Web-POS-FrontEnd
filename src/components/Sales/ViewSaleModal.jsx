import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatCurrency";

/* ── Dashed separator ── */
const Dash = () => (
  <div className="my-2.5 border-t border-dashed border-slate-300" />
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

  /* Derive subtotal from actual items when available */
  const lineItems = Array.isArray(saleData.items) && saleData.items.length > 0 ? saleData.items : null;
  const subtotal  = lineItems ? lineItems.reduce((sum, i) => sum + (i.quantity ?? i.qty ?? 0) * (i.price ?? i.unitPrice ?? 0), 0) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* ── Modal chrome header ── */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sale Receipt</h2>
              <p className="text-[11px] text-slate-500 font-medium">{saleData.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Paper receipt body ── */}
        <div className="max-h-[65vh] overflow-y-auto bg-slate-50 border-x border-slate-100 px-6 py-6">
          <div className="font-mono text-[12.5px] leading-relaxed text-slate-800">

            {/* Store header */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                *** OFFICIAL RECEIPT ***
              </p>
              <p className="mt-1 text-[17px] font-bold tracking-widest text-slate-900">DISSANAYAKE SUPER</p>
              <p className="text-[11px] text-slate-500 mt-1">No. 45, Main Street, Colombo 07</p>
              <p className="text-[11px] text-slate-500">Tel: +94 11 234 5678</p>
              <p className="text-[11px] text-slate-500">VAT Reg: 114-456-7890</p>
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
                valueClass={isCard ? "font-semibold text-indigo-600" : "font-semibold text-emerald-600"}
              />
              {isVoid && (
                <MetaRow label="Status" value="** VOID **" valueClass="font-bold text-red-600" />
              )}
            </div>

            <Dash />

            {/* Items mini-table */}
            <table className="mt-1 w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-dashed border-slate-200">
                  <th className="pb-1 text-left font-semibold w-[40%]">Item</th>
                  <th className="pb-1 text-center font-semibold w-[10%]">Qty</th>
                  <th className="pb-1 text-right font-semibold w-[25%]">Price</th>
                  <th className="pb-1 text-right font-semibold w-[25%]">Total</th>
                </tr>
              </thead>
              <tbody className="pt-1 block w-full" style={{ display: 'table-row-group' }}>
                {lineItems ? (
                  lineItems.map((item, i) => {
                    const qty   = item.quantity ?? item.qty ?? 0;
                    const price = item.price ?? item.unitPrice ?? 0;
                    const lineTotal = qty * price;
                    return (
                      <tr key={i} className="align-top">
                        <td className="py-1 pr-1 text-slate-800 leading-snug font-medium">{item.name}</td>
                        <td className="py-1 text-center text-slate-500">{qty}</td>
                        <td className="py-1 text-right text-slate-500">{formatCurrency(price)}</td>
                        <td className="py-1 text-right font-semibold text-slate-800">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center italic text-slate-400">
                      No items recorded for this sale.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Dash />

            {/* Subtotals — only shown when items are available */}
            {subtotal !== null && (
              <div className="space-y-0.5 text-[12px] text-slate-500">
                <MetaRow label="Subtotal" value={formatCurrency(subtotal)} />
              </div>
            )}

            {/* Heavy rule before grand total */}
            <div className="my-3 border-t-2 border-slate-400" />

            <div className="flex justify-between text-[15px] font-bold text-slate-900">
              <span>TOTAL</span>
              <span>{formatCurrency(saleData.totalAmount)}</span>
            </div>

            <Dash />

            {/* Footer note */}
            <div className="text-center text-[11px] leading-5 text-slate-400 mt-4">
              <p>Goods once sold are not returnable.</p>
              <p>Thank you for shopping with us!</p>
              <p className="mt-1.5 tracking-widest font-semibold text-slate-300">*** THANK YOU COME AGAIN ***</p>
            </div>

          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-3 border-t border-slate-200 bg-white px-5 py-4">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" onClick={onClose}>
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
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? `font-bold text-slate-900 ${valueClass}` : valueClass || "text-slate-800 font-medium"}>
        {value}
      </span>
    </div>
  );
}
