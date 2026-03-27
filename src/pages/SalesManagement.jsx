import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/utils/formatCurrency";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import Swal from "sweetalert2";

const API = "/api/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReceiptText, Search, Eye, Ban, Banknote, CreditCard, RotateCcw } from "lucide-react";
import ViewSaleModal from "@/components/Sales/ViewSaleModal";


const formatDateTime = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

function StatusBadge({ status }) {
  const completed = status === "Completed";
  const returned  = status === "Returned";

  const colorCls = completed
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    : returned
    ? "bg-amber-500/10 text-amber-700 border-amber-200"
    : "bg-red-500/10 text-red-700 border-red-200";

  const dotCls = completed ? "bg-emerald-500" : returned ? "bg-amber-500" : "bg-red-500";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", colorCls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotCls)} />
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
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700"
      )}
    >
      {isCash ? <Banknote className="h-3 w-3 shrink-0" /> : <CreditCard className="h-3 w-3 shrink-0" />}
      {method}
    </span>
  );
}


export default function SalesManagement() {
  const { showToast } = useToast();
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [returningId, setReturningId] = useState(null); // tracks in-flight return request

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(API);
      const responseData = response.data;
      const salesArray = Array.isArray(responseData)
        ? responseData
        : (responseData.content || responseData.data || []);
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
      await api.put(`${API}/${id}/status`, { status: "Voided" });
      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Voided" } : s))
      );
    } catch (err) {
      console.error("Failed to void sale:", err);
      alert("Failed to void sale. Please try again.");
    }
  };

  /* ── Return handler ── */
  const handleReturn = async (id) => {
    const sale = sales.find((s) => s.id === id);
    const label = sale?.receiptNo ?? `#${id}`;

    const result = await Swal.fire({
      title: "Return this sale?",
      html: `<p class="text-sm text-gray-500">Sale <strong>${label}</strong> will be marked as <strong>Returned</strong> and all items will be restocked to inventory.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, return it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setReturningId(id);
    try {
      await api.post(`${API}/${id}/return`);
      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "Returned" } : s))
      );
      showToast(`Sale ${label} has been returned and inventory restocked.`, "success");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to process return. Please try again.";
      showToast(msg, "error");
      console.error("Failed to return sale:", err);
    } finally {
      setReturningId(null);
    }
  };

  /* ── Stats ── */
  const completedSales = sales.filter((s) => s.status === "Completed");
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashCount = completedSales.filter((s) => s.paymentMethod === "Cash").length;
  const cardCount = completedSales.filter((s) => s.paymentMethod === "Card").length;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-none py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                <ReceiptText className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Ledger</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 ml-16">
              {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded · read-only
            </p>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-4 sm:px-6 lg:px-8">
          {[
            { label: "Total Revenue",   value: formatCurrency(totalRevenue) },
            { label: "Completed Sales", value: completedSales.length },
            { label: "Cash Payments",   value: cashCount },
            { label: "Card Payments",   value: cardCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <p className="text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{stat.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search receipt no. or payment…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-xl placeholder:text-slate-400 focus-visible:ring-slate-300"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar shrink-0">
                {["All", "Completed", "Voided", "Returned"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-[13px] font-medium transition-colors border shadow-sm whitespace-nowrap",
                      filterStatus === s
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Loading spinner ── */}
            {isLoading && (
              <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-sm font-medium">Loading sales data…</span>
              </div>
            )}

            {/* ── Table ── */}
            {!isLoading && (
              <>
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-sm">

                  {/* -- Head -- */}
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-[14%] px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Receipt No.
                      </th>
                      <th className="w-[18%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Date &amp; Time
                      </th>
                      <th className="w-[16%] px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Total Amount
                      </th>
                      <th className="w-[16%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Payment Method
                      </th>
                      <th className="w-[12%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Status
                      </th>
                      <th className="w-[24%] px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* -- Body -- */}
                  <tbody className="divide-y divide-slate-50">
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
                    const isVoid     = (sale?.status ?? "") === "Voided";
                    const isReturned = (sale?.status ?? "") === "Returned";
                    const isInactive = isVoid || isReturned;
                    const isCompleted = (sale?.status ?? "") === "Completed";
                    return (
                      <tr
                        key={sale.id}
                        className={cn(
                          "group transition-colors hover:bg-muted/40",
                          isInactive && "opacity-55"
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

                         {/* Status – centered */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <StatusBadge status={sale?.status || 'N/A'} />
                          </div>
                        </td>

                        {/* Actions – right-aligned */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            {/* View */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setViewSale(sale); setIsViewOpen(true); }}
                              className="h-8 gap-1.5 px-3 text-[12px] font-medium border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>

                            {/* Void — only for Completed */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isInactive}
                              onClick={() => handleVoid(sale.id)}
                              className={cn(
                                "h-8 gap-1.5 px-3 text-[12px] font-medium border-slate-200 shadow-sm",
                                !isInactive
                                  ? "text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                                  : "opacity-40 text-slate-400 border-slate-100"
                              )}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {isVoid ? "Voided" : "Void"}
                            </Button>

                            {/* Return Sale — only active for Completed */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!isCompleted || returningId === sale.id}
                              onClick={() => handleReturn(sale.id)}
                              className={cn(
                                "h-8 gap-1.5 px-3 text-[12px] font-medium border-slate-200 shadow-sm",
                                isCompleted && returningId !== sale.id
                                  ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                                  : "opacity-40 text-slate-400 border-slate-100"
                              )}
                            >
                              <RotateCcw className={cn("h-3.5 w-3.5", returningId === sale.id && "animate-spin")} />
                              {isReturned ? "Returned" : returningId === sale.id ? "Returning…" : "Return"}
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
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="text-[12px] text-slate-500">
              Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-900">{sales.length}</span> transaction
              {sales.length !== 1 ? "s" : ""}
            </p>
            {filterStatus !== "All" && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
                Filter: {filterStatus}
              </span>
            )}
          </div>
              </>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* ── View Receipt Modal ── */}
      <ViewSaleModal
        isOpen={isViewOpen}
        onClose={() => { setIsViewOpen(false); setViewSale(null); }}
        saleData={viewSale}
      />
    </div>
  );
}
