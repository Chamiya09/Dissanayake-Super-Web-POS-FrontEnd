import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axiosInstance";
import { formatCurrency } from "@/utils/formatCurrency";
import { AppHeader } from "@/components/Layout/AppHeader";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";
import { useToast } from "@/context/GlobalToastContext";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { useAuth } from "@/context/AuthContext";

const API = "/api/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReceiptText, Search, Eye, Ban, Banknote, CreditCard, RotateCcw, TrendingUp, CheckCircle, SlidersHorizontal, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ViewSaleModal from "@/components/Sales/ViewSaleModal";
import ReturnSaleItemsModal from "@/components/Sales/ReturnSaleItemsModal";
import SupervisorApprovalModal from "@/components/Sales/SupervisorApprovalModal";


const formatDateTime = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const getTransactionId = (sale) => sale?.transactionId ?? sale?.receiptNo ?? "";

const getSaleDisplayTotal = (sale) => {
  if (!Array.isArray(sale?.items) || sale.items.length === 0) {
    return Number(sale?.totalAmount || 0);
  }

  const remainingTotal = sale.items.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const returned = Number(item?.returnedQuantity ?? 0);
    const unitPrice = Number(item?.unitPrice ?? 0);
    const remainingQty = Math.max(0, qty - returned);
    return sum + remainingQty * unitPrice;
  }, 0);

  return Number(remainingTotal.toFixed(2));
};

const toDateKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseDateKey = (value) => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const formatDateLabel = (value, placeholder) => {
  if (!value) return placeholder;
  const date = parseDateKey(value);
  if (!date) return placeholder;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusSortPriority = (status) => {
  if (status === "Completed") return 0;
  if (status === "Partially Returned") return 1;
  if (status === "Returned") return 2;
  if (status === "Voided") return 3;
  return 4;
};

function StatusBadge({ status }) {
  const completed = status === "Completed";
  const returned  = status === "Returned";
  const partiallyReturned = status === "Partially Returned";

  const colorCls = completed
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    : partiallyReturned
    ? "bg-orange-500/10 text-orange-700 border-orange-200"
    : returned
    ? "bg-amber-500/10 text-amber-700 border-amber-200"
    : "bg-red-500/10 text-red-700 border-red-200";

  const dotCls = completed
    ? "bg-emerald-500"
    : partiallyReturned
    ? "bg-orange-500"
    : returned
    ? "bg-amber-500"
    : "bg-red-500";

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

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg, iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{label}</span>
          <span className="mt-1 text-2xl font-bold text-slate-900 leading-none tabular-nums">{value}</span>
        </div>
      </div>
      {sub && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">{sub}</span>
        </div>
      )}
    </div>
  );
}


export default function SalesManagement() {
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { user } = useAuth();
  const isStaffView = user?.role === "Staff";
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [returningId, setReturningId] = useState(null); // tracks in-flight return request
  const [returnSale, setReturnSale] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [pendingReturnPayload, setPendingReturnPayload] = useState(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

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

  const handleFromDateChange = (value) => {
    setFromDate(value);
    if (toDate && value && value > toDate) {
      setToDate(value);
    }
  };

  const handleToDateChange = (value) => {
    setToDate(value);
    if (fromDate && value && value < fromDate) {
      setFromDate(value);
    }
  };

  /* ── Filtering ── */
  const filtered = (sales ?? []).filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || getTransactionId(s).toLowerCase().includes(q) || (s?.paymentMethod ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || (s?.status ?? "") === filterStatus;
    const saleDateKey = toDateKey(s?.saleDate);
    const hasCompleteDateRange = !!fromDate && !!toDate;
    const matchDateRange = !hasCompleteDateRange || (saleDateKey && saleDateKey >= fromDate && saleDateKey <= toDate);
    return matchSearch && matchStatus && matchDateRange;
  });

  const tableRows = [...filtered].sort((a, b) => {
    const statusDiff = getStatusSortPriority(a?.status ?? "") - getStatusSortPriority(b?.status ?? "");
    if (statusDiff !== 0) return statusDiff;

    const dateA = new Date(a?.saleDate ?? 0).getTime();
    const dateB = new Date(b?.saleDate ?? 0).getTime();
    return dateB - dateA;
  });

  /* ── Void handler ── */
  const handleVoid = async (id) => {
    const sale = sales.find((s) => s.id === id);
    const label = getTransactionId(sale) || `#${id}`;
    const confirmed = await confirm({
      title: "Void this sale?",
      message: `Sale ${label} will be marked as Voided. This action cannot be undone.`,
      confirmText: "Void Sale",
      cancelText: "Cancel",
      tone: "destructive",
    });
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

  /* ── Return handlers ── */
  const extractApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    return data?.detail || data?.message || data?.error || fallback;
  };

  const openReturnModal = async (sale) => {
    try {
      const response = await api.get(`${API}/${sale.id}`);
      setReturnSale(response.data);
    } catch (err) {
      console.error("Failed to load latest sale details for return:", err);
      setReturnSale(sale);
    }
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    if (returningId !== null) return;
    setIsReturnModalOpen(false);
    setIsApprovalOpen(false);
    setPendingReturnPayload(null);
    setReturnSale(null);
  };

  const handleReturnItems = async (payload) => {
    setPendingReturnPayload(payload);
    setIsApprovalOpen(true);
  };

  const handleSupervisorApproval = async ({ approverEmail, approverPassword }) => {
    if (!returnSale?.id) return;

    if (!approverEmail || !approverPassword) {
      showToast("Approval Denied: Approver email and password are required.", "error");
      return;
    }

    setReturningId(returnSale.id);
    try {
      await api.post(`${API}/${returnSale.id}/return-items`, {
        ...(pendingReturnPayload ?? {}),
        approverEmail,
        approverPassword,
      });

      // Always refresh from server so totalAmount/status are guaranteed current.
      await fetchSales();

      showToast(`Return processed for sale ${getTransactionId(returnSale)}.`, "success");
      setIsApprovalOpen(false);
      setPendingReturnPayload(null);
      setIsReturnModalOpen(false);
      setReturnSale(null);
    } catch (err) {
      const status = err?.response?.status;
      const msg = extractApiErrorMessage(err, "Failed to process return. Please try again.");

      if (status === 401 || /invalid approver credentials/i.test(msg)) {
        showToast("Approval Denied: Invalid Credentials", "error");
      } else if (status === 403 || /unauthorized approver/i.test(msg)) {
        showToast("Approval Denied: Unauthorized Approver", "error");
      } else if (status === 404 && !/sale\s+not\s+found|not\s+found\s+with\s+id/i.test(msg)) {
        showToast(
          "Partial return endpoint is not available on backend. Please restart/update backend and try again.",
          "error"
        );
      } else {
        showToast(msg, "error");
      }
      console.error("Failed to return selected items:", err);
    } finally {
      setReturningId(null);
    }
  };

  /* ── Stats ── */
  const completedSales = sales.filter((s) => s.status === "Completed");
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashCount = completedSales.filter((s) => s.paymentMethod === "Cash").length;
  const cardCount = completedSales.filter((s) => s.paymentMethod === "Card").length;
  const hasActiveFilters = search !== "" || filterStatus !== "All" || fromDate !== "" || toDate !== "";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-none py-8 space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
                <ReceiptText size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isStaffView ? "My Sales & Returns" : "Sales Ledger"}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {sales.length} transaction{sales.length !== 1 ? "s" : ""} recorded
                  {isStaffView ? " for your cashier account" : " across the store"}
                </p>
              </div>
            </div>
        </div>

        {/* ── Stats strip ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6 lg:px-8">
            {[
              { 
                label: "Total Revenue",   
                value: formatCurrency(totalRevenue),
                icon: TrendingUp,
                iconBg: "bg-indigo-50",
                iconColor: "text-indigo-600",
                sub: "Revenue from completed sales"
              },
              { 
                label: "Completed Sales", 
                value: completedSales.length,
                icon: CheckCircle,
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                sub: "Successfully completed transactions"
              },
              { 
                label: "Cash Payments",   
                value: cashCount,
                icon: Banknote,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                sub: "Completed sales paid in cash"
              },
              { 
                label: "Card Payments",   
                value: cardCount,
                icon: CreditCard,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                sub: "Completed sales paid by card"
              },
            ].map((stat) => (
              <SummaryCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                iconBg={stat.iconBg}
                iconColor={stat.iconColor}
                sub={stat.sub}
              />
            ))}
          </div>

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search transaction ID or payment…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-white border-slate-200 rounded-xl placeholder:text-slate-400 focus-visible:ring-slate-300"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 w-44 text-sm bg-white border-slate-200 rounded-xl focus:ring-slate-300">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Partially Returned">Partially Returned</SelectItem>
                    <SelectItem value="Voided">Voided</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 w-44 justify-start rounded-xl border-slate-200 bg-white text-sm font-normal",
                        !fromDate && "text-slate-400"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formatDateLabel(fromDate, "Start date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={parseDateKey(fromDate)}
                      onSelect={(date) => handleFromDateChange(date ? toDateKey(date) : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 w-44 justify-start rounded-xl border-slate-200 bg-white text-sm font-normal",
                        !toDate && "text-slate-400"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formatDateLabel(toDate, "End date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={parseDateKey(toDate)}
                      onSelect={(date) => handleToDateChange(date ? toDateKey(date) : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-xl"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Reset Dates
                </Button>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 text-xs font-medium text-slate-400 hover:text-slate-700 rounded-xl shrink-0"
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("All");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* ── Loading spinner ── */}
            {isLoading && (
              <RefreshLoadingTheme
                title="Loading Sales"
                subtitle="Preparing transaction history..."
              />
            )}

            {/* ── Table ── */}
            {!isLoading && (
              <>
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-sm">

                  {/* -- Head -- */}
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-[14%] px-6 py-4 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                        Transaction ID
                      </th>
                      <th className="w-[18%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                        Date &amp; Time
                      </th>
                      <th className="w-[16%] px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                        Total Amount
                      </th>
                      <th className="w-[16%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                        Payment Method
                      </th>
                      <th className="w-[12%] px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
                        Status
                      </th>
                      <th className="w-[24%] px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent">
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
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-muted-foreground">
                      No transactions match your search.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((sale) => {
                    const { date, time } = formatDateTime(sale?.saleDate || new Date().toISOString());
                    const isVoid     = (sale?.status ?? "") === "Voided";
                    const isReturned = (sale?.status ?? "") === "Returned";
                    const isPartiallyReturned = (sale?.status ?? "") === "Partially Returned";
                    const isInactive = isVoid || isReturned;
                    const isCompleted = (sale?.status ?? "") === "Completed";
                    const canReturn = isCompleted || isPartiallyReturned;
                    const displayTotal = getSaleDisplayTotal(sale);
                    return (
                      <tr
                        key={sale.id}
                        className={cn(
                          "group transition-colors hover:bg-muted/40",
                          isInactive && "opacity-55"
                        )}
                      >
                        {/* Transaction ID */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-[13px] font-bold tracking-tight text-primary">
                            {getTransactionId(sale) || 'N/A'}
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
                            {formatCurrency(displayTotal)}
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
                          <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
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
                              disabled={!canReturn || returningId === sale.id}
                              onClick={() => openReturnModal(sale)}
                              className={cn(
                                "h-8 gap-1.5 px-3 text-[12px] font-medium border-slate-200 shadow-sm",
                                canReturn && returningId !== sale.id
                                  ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                                  : "opacity-40 text-slate-400 border-slate-100"
                              )}
                            >
                              <RotateCcw className={cn("h-3.5 w-3.5", returningId === sale.id && "animate-spin")} />
                              {isReturned
                                ? "Returned"
                                : returningId === sale.id
                                ? "Returning..."
                                : "Return Items"}
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

      <ReturnSaleItemsModal
        isOpen={isReturnModalOpen}
        onClose={closeReturnModal}
        saleData={returnSale}
        onConfirm={handleReturnItems}
        isSubmitting={returningId !== null || isApprovalOpen}
      />

      <SupervisorApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => {
          if (returningId !== null) return;
          setIsApprovalOpen(false);
          setPendingReturnPayload(null);
        }}
        onSubmit={handleSupervisorApproval}
        isSubmitting={returningId !== null}
      />
    </div>
  );
}
