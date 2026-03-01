import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";

const API = "http://localhost:8080/api/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReceiptText, Search, Eye, Ban, Banknote, CreditCard, Pencil } from "lucide-react";
import ViewSaleModal from "@/components/Sales/ViewSaleModal";
import EditSaleModal from "@/components/Sales/EditSaleModal";


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


export default function SalesManagement() {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API);
      const responseData = response.data;
      const salesArray = Array.isArray(responseData)
        ? responseData
        : (responseData.content || responseData.data || []);
      console.log("Fetched Sales:", responseData);
      console.log("Extracted Sales Array:", salesArray);
      setSales(salesArray);
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);
  const [viewSale, setViewSale] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  /* ── Filtering ── */
  const filtered = (sales ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (s?.receiptNo ?? "").toLowerCase().includes(q) || (s?.paymentMethod ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || (s?.status ?? "") === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ── Void handler ── */
  const handleVoid = async (id) => {
    const sale = sales.find((s) => s.id === id);
    const label = sale?.receiptNo ?? `#${id}`;
    const confirmed = window.confirm(
      `Void sale ${label}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await axios.put(`${API}/${id}/status`, { status: "Voided" });
      // Optimistic UI update — no need to wait for a full re-fetch
      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Voided" } : s))
      );
    } catch (err) {
      console.error("Failed to void sale:", err);
      alert("Failed to void sale. Please try again.");
    }
  };

  /* -- Edit save handler -- */
  const handleEditSave = (updated) => {
    setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  /* ── Stats ── */
  const completedSales = sales.filter((s) => s.status === "Completed");
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashCount = completedSales.filter((s) => s.paymentMethod === "Cash").length;
  const cardCount = completedSales.filter((s) => s.paymentMethod === "Card").length;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">

        {}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">Sales Ledger</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded · read-only
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
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

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search receipt no. or payment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Completed", "Voided"].map((s) => (
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

        {/* ── Loading spinner ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-2 text-sm text-muted-foreground">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading sales data…
          </div>
        )}

        {/* ── Table ── */}
        {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">

              {/* -- Head -- */}
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="w-[14%] px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Receipt No.
                  </th>
                  <th className="w-[18%] px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date &amp; Time
                  </th>
                  <th className="w-[16%] px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Amount
                  </th>
                  <th className="w-[16%] px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Method
                  </th>
                  <th className="w-[12%] px-6 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="w-[24%] px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* -- Body -- */}
              <tbody className="divide-y divide-border">
                {!sales || sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-muted-foreground">
                      No sales data available.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-muted-foreground">
                      No transactions match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => {
                    const { date, time } = formatDateTime(sale?.saleDate || new Date().toISOString());
                    const isVoid = (sale?.status ?? "") === "Voided";
                    return (
                      <tr
                        key={sale.id}
                        className={cn(
                          "group transition-colors hover:bg-muted/40",
                          isVoid && "opacity-55"
                        )}
                      >
                        {/* Receipt No. */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-[13px] font-bold tracking-tight text-primary">
                            {sale?.receiptNo || 'N/A'}
                          </span>
                        </td>

                        {/* Date & Time � centered */}
                        <td className="px-6 py-4 text-center">
                          <p className="text-[13px] font-medium text-foreground">{date}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{time}</p>
                        </td>

                        {/* Total Amount � right-aligned */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-[13px] font-semibold tabular-nums text-foreground">
                            {formatCurrency(sale?.totalAmount || 0)}
                          </span>
                        </td>

                        {/* Payment Method � centered */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <PaymentBadge method={sale?.paymentMethod || 'N/A'} />
                          </div>
                        </td>

                        {/* Status � centered */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <StatusBadge status={sale?.status || 'N/A'} />
                          </div>
                        </td>

                        {/* Actions � right-aligned */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
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

          {/* -- Table footer -- */}
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
        )}
      </div>

      {/* ── View Receipt Modal ── */}
      <ViewSaleModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setViewSale(null); }}
        saleData={viewSale}
      />
      {/* -- Edit Sale Modal -- */}
      <EditSaleModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditSale(null); }}
        saleData={editSale}
        onSave={handleEditSave}
      />
    </div>
  );
}
