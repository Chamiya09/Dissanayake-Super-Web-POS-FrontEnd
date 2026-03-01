import { useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReceiptText, Search, Eye, Ban, Banknote, CreditCard, Pencil } from "lucide-react";
import ViewSaleModal from "@/components/Sales/ViewSaleModal";
import EditSaleModal from "@/components/Sales/EditSaleModal";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Mock data
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const initialSales = [
  { id: "RCP-0001", dateTime: "2026-02-25T09:14:00", totalAmount: 4850.00, paymentMethod: "Cash", status: "Completed" },
  { id: "RCP-0002", dateTime: "2026-02-25T11:47:00", totalAmount: 12300.50, paymentMethod: "Card", status: "Completed" },
  { id: "RCP-0003", dateTime: "2026-02-26T14:22:00", totalAmount: 7625.75, paymentMethod: "Cash", status: "Void" },
  { id: "RCP-0004", dateTime: "2026-02-27T16:05:00", totalAmount: 21480.00, paymentMethod: "Card", status: "Completed" },
  { id: "RCP-0005", dateTime: "2026-02-28T08:53:00", totalAmount: 3320.25, paymentMethod: "Cash", status: "Completed" },
  { id: "RCP-0006", dateTime: "2026-03-01T10:30:00", totalAmount: 9875.00, paymentMethod: "Card", status: "Void" },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers / sub-components
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

function StatusBadge({ status }) {
  const completed = status === "Completed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        completed
          ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", completed ? "bg-emerald-500" : "bg-red-500")} />
      {status}
    </span>
  );
}

function PaymentBadge({ method }) {
  const isCash = method === "Cash";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        isCash
          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
      )}
    >
      {isCash ? <Banknote className="h-3 w-3 shrink-0" /> : <CreditCard className="h-3 w-3 shrink-0" />}
      {method}
    </span>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Page
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function SalesManagement() {
  const [sales, setSales] = useState(initialSales);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewSale, setViewSale] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  /* â”€â”€ Filtering â”€â”€ */
  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.id.toLowerCase().includes(q) || s.paymentMethod.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* â”€â”€ Void handler â”€â”€ */
  const handleVoid = (id) => {
    setSales((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Void" } : s)));
  };

  /* ── Edit save handler ── */
  const handleEditSave = (updated) => {
    setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  /* â”€â”€ Stats â”€â”€ */
  const completedSales = sales.filter((s) => s.status === "Completed");
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashCount = completedSales.filter((s) => s.paymentMethod === "Cash").length;
  const cardCount = completedSales.filter((s) => s.paymentMethod === "Card").length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {/* â”€â”€ Page header â”€â”€ */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">Sales Ledger</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded Â· read-only
              </p>
            </div>
          </div>
        </div>

        {/* â”€â”€ Stats strip â”€â”€ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",   value: formatCurrency(totalRevenue) },
            { label: "Completed Sales", value: completedSales.length },
            { label: "Cash Payments",   value: cashCount },
            { label: "Card Payments",   value: cardCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
              <p className="text-[20px] font-bold text-foreground tabular-nums leading-snug">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* â”€â”€ Toolbar â”€â”€ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search receipt no. or paymentâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Completed", "Void"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors",
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ Table â”€â”€ */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full">

              {/* ── Head ── */}
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Receipt No.
                  </th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date &amp; Time
                  </th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Amount
                  </th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Method
                  </th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* ── Body ── */}
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-muted-foreground">
                      No transactions match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => {
                    const { date, time } = formatDateTime(sale.dateTime);
                    const isVoid = sale.status === "Void";
                    return (
                      <tr
                        key={sale.id}
                        className={cn(
                          "group transition-colors hover:bg-muted/40",
                          isVoid && "opacity-55"
                        )}
                      >
                        {/* Receipt No. */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-[13px] font-bold tracking-tight text-primary">
                            {sale.id}
                          </span>
                        </td>

                        {/* Date & Time */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="text-[13px] font-medium text-foreground">{date}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{time}</p>
                        </td>

                        {/* Total Amount — right-aligned */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">
                            {formatCurrency(sale.totalAmount)}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <PaymentBadge method={sale.paymentMethod} />
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={sale.status} />
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* View */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setViewSale(sale); setIsViewOpen(true); }}
                              className="h-8 gap-1.5 px-3 text-[12px] font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isVoid}
                              onClick={() => { setEditSale(sale); setIsEditOpen(true); }}
                              className={cn(
                                "h-8 gap-1.5 px-3 text-[12px] font-medium",
                                !isVoid
                                  ? "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                  : "opacity-40"
                              )}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>

                            {/* Void */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isVoid}
                              onClick={() => handleVoid(sale.id)}
                              className={cn(
                                "h-8 gap-1.5 px-3 text-[12px] font-medium",
                                !isVoid
                                  ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                  : "opacity-40"
                              )}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {isVoid ? "Voided" : "Void"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Table footer ── */}
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-3">
            <p className="text-[11px] text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{sales.length}</span> transaction
              {sales.length !== 1 ? "s" : ""}
            </p>
            {filterStatus !== "All" && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Filter: {filterStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ View Receipt Modal â”€â”€ */}
      <ViewSaleModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setViewSale(null); }}
        saleData={viewSale}
      />
      {/* ── Edit Sale Modal ── */}
      <EditSaleModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditSale(null); }}
        saleData={editSale}
        onSave={handleEditSave}
      />
    </div>
  );
}
