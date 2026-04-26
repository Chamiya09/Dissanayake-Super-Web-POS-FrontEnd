import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import { PiPrefixSearchInput } from "@/components/ui/PiPrefixSearchInput";
import api from "@/lib/axiosInstance";
import { getLowStockItems, createOrder, mapHistoryItem } from "@/api/reorderApi";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { RefreshLoadingTheme } from "@/components/ui/RefreshLoadingTheme";
import { useInventory }     from "@/context/InventoryContext";
import { useReorder }       from "@/context/ReorderContext";
import { useToast }         from "@/context/GlobalToastContext";
import { useProductForecast } from "@/hooks/useForecast";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  AlertTriangle,
  PackageSearch,
  Search,
  SlidersHorizontal,
  RefreshCw,
  DollarSign,
  ArrowRight,
  X,
  ShoppingCart,
  Mail,
  Send,
  TrendingUp,
  Building2,
  Loader2,
} from "lucide-react";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    LOW_STOCK:    { dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 border border-amber-200", label: "Low Stock"    },
    OUT_OF_STOCK: { dot: "bg-red-500",   cls: "bg-red-50   text-red-700   border border-red-200",   label: "Out of Stock" },
  };
  const s = map[status] ?? { dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600 border border-slate-200", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{label}</span>
          <span className="mt-1 text-2xl font-bold text-slate-900 leading-none">{value}</span>
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

const SYSTEM_SENDER_EMAIL = "dissanayakasuperorder@gmail.com";

// ─── Place-Order Modal (Two-Step Wizard) ────────────────────────────────────

function PlaceOrderModal({ item, onClose, onSubmit }) {
  const orderingBlocked = item.productStatus === "DISCONTINUED" || item.status === "DISCONTINUED";
  const { showToast } = useToast();
  const assignedSupplier = {
    companyName:   item.supplierName  ?? item.supplier?.companyName ?? null,
    email:         item.supplierEmail ?? item.supplier?.email ?? null,
    isActive:      item.supplierActive ?? item.supplier?.isActive ?? null,
  };
  const isSupplierDisabled = assignedSupplier.isActive === false;
  const currentStock = Math.max(0, Number(item.stockQuantity ?? 0));
  const [selectedProductId, setSelectedProductId] = useState(() => String(item.sku ?? item.productId ?? item.id ?? ""));
  const [timeframe, setTimeframe] = useState("monthly");
  const [predictedDemand, setPredictedDemand] = useState(0);
  const forecastQuery = useProductForecast(isSupplierDisabled ? null : selectedProductId, timeframe as "weekly" | "monthly");
  const suggestedOrderQty = Math.max(0, Math.ceil((predictedDemand ?? 0) - currentStock));
  const isSafeStock = currentStock >= (predictedDemand ?? 0);
  const [step,    setStep]    = useState(1);
  const [stepDir, setStepDir] = useState("fwd");
  const [qty,     setQty]     = useState(suggestedOrderQty);

  useEffect(() => {
    setSelectedProductId(String(item.sku ?? item.productId ?? item.id ?? ""));
  }, [item]);

  useEffect(() => {
    if (forecastQuery.data) {
      const next = Math.max(0, Math.round(Number(forecastQuery.data.predictedDemand ?? 0)));
      setPredictedDemand(next);
      return;
    }
    if (forecastQuery.isError) {
      setPredictedDemand(0);
    }
  }, [forecastQuery.data, forecastQuery.isError]);

  useEffect(() => {
    setQty(suggestedOrderQty);
  }, [suggestedOrderQty, selectedProductId]);

  // Directional navigation — sets animation direction before updating step
  function goTo(n) {
    setStepDir(n > step ? "fwd" : "bwd");
    setStep(n);
  }

  // Supplier details come from the real API (supplierName / supplierEmail on the item).
  // Both fields are nullable — a product with no assigned supplier shows a warning.
  const hasSupplier = Boolean(assignedSupplier.email);

  function blockInactiveSupplier() {
    showToast("This supplier is inactive. Please enable the supplier to proceed.", "error");
  }

  const gap      = Math.max(0, (item.reorderLevel ?? 0) - (item.stockQuantity ?? 0));
  const velocity = Math.max(1, Math.round((item.reorderLevel ?? 10) / 3));
  const daysLeft = item.stockQuantity > 0 ? Math.floor(item.stockQuantity / velocity) : 0;
  const stockPct = Math.min(100, ((item.stockQuantity ?? 0) / Math.max(1, item.reorderLevel ?? 1)) * 100);

  const emailBody = [
    `Dear ${assignedSupplier.companyName ?? "Supplier"},`,
    ``,
    `We are placing a formal purchase order for the following item:`,
    ``,
    `  Product   : ${item.productName}`,
    `  SKU       : ${item.sku ?? "N/A"}`,
    `  Category  : ${item.category ?? "N/A"}`,
    `  Quantity  : ${qty} ${item.unit ?? "units"}`,
    `  Date      : ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `Current stock: ${item.stockQuantity ?? 0} ${item.unit ?? "units"} (reorder threshold: ${item.reorderLevel ?? 0}).`,
    ``,
    `Please confirm availability and expected delivery date at your earliest convenience.`,
    ``,
    `Regards,`,
    `Purchasing Department`,
    `Dissanayake Super Inventory System`,
    ``,
    `---`,
    `This is an automated purchase order sent via Dissanayake Super Management System (Gmail Integration).`,
  ].join("\n");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                Purchase Order Wizard
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {step === 1 ? "Step 1 — Order Details" : "Step 2 — Email Preview"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center gap-0 border-b border-slate-100 bg-slate-50/70 px-6 py-3 shrink-0">
          {[
            { n: 1, label: "Reorder Details" },
            { n: 2, label: "Supplier & Email" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-0">
              {i > 0 && (
                <div className={`h-px w-10 mx-2 transition-colors duration-300 ${step > 1 ? "bg-teal-400" : "bg-slate-200"}`} />
              )}
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ring-2 ${
                  step === n
                    ? "bg-teal-600 text-white ring-teal-200"
                    : step > n
                    ? "bg-teal-600 text-white ring-teal-200"
                    : "bg-white text-slate-400 ring-slate-200"
                }`}>
                  {step > n ? "✓" : n}
                </div>
                <span className={`text-[12px] font-semibold transition-colors duration-300 ${
                  step === n ? "text-slate-900" : step > n ? "text-teal-600" : "text-slate-400"
                }`}>
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Body (scrollable) ── */}
        <div
          key={step}
          className={`overflow-y-auto flex-1 px-6 py-5 ${
            stepDir === "fwd"
              ? "animate-in slide-in-from-right-4 duration-300"
              : "animate-in slide-in-from-left-4 duration-300"
          }`}
        >

          {/* ════ STEP 1: Reorder Details & AI Insight ════ */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Product summary row */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 mt-0.5">
                  <PackageSearch className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{item.productName}</p>
                  {item.sku && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.sku}</p>}
                  {item.category && <p className="text-[11px] text-slate-400">{item.category}</p>}
                  {isSupplierDisabled && (
                    <span
                      title="Cannot place order: This supplier is currently inactive"
                      className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                    >
                      Supplier Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Stock status row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Current Stock",
                    value: `${item.stockQuantity ?? 0}`,
                    unit: item.unit ?? "units",
                    color: item.stockQuantity === 0 ? "text-red-600" : "text-amber-600",
                    bg: "bg-slate-50 border-slate-200",
                  },
                  {
                    label: "Reorder Level",
                    value: `${item.reorderLevel ?? 0}`,
                    unit: item.unit ?? "units",
                    color: "text-slate-700",
                    bg: "bg-slate-50 border-slate-200",
                  },
                  {
                    label: "Shortage",
                    value: `${gap}`,
                    unit: item.unit ?? "units",
                    color: "text-orange-600",
                    bg: "bg-slate-50 border-slate-200",
                  },
                ].map(({ label, value, unit, color, bg }) => (
                  <div key={label} className={`rounded-xl border px-3 py-3 text-center ${bg}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                    <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{unit}</p>
                  </div>
                ))}
              </div>

              {/* Stock level bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-500 font-medium">Stock Level</span>
                  <span className="text-[12px] text-slate-500">{Math.round(stockPct)}% of reorder level</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stockPct}%`,
                      background: stockPct === 0 ? "#dc2626"
                                : stockPct < 40  ? "linear-gradient(90deg,#dc2626,#f59e0b)"
                                                 : "#f59e0b",
                    }}
                  />
                </div>
              </div>

              {/* AI recommendation card */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                <div className="mb-3 flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
                    Forecast Period
                  </label>
                  <div className="inline-flex w-full rounded-lg border border-blue-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setTimeframe("weekly")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        timeframe === "weekly"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-blue-50"
                      }`}
                    >
                      Next Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeframe("monthly")}
                      className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        timeframe === "monthly"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:bg-blue-50"
                      }`}
                    >
                      Next Month
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-700">
                    AI Forecast
                  </span>
                  {forecastQuery.isFetching && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching forecast...
                    </span>
                  )}
                </div>
                {forecastQuery.isLoading ? (
                  <div className="animate-pulse rounded-lg border border-blue-100 bg-white/70 px-3 py-3">
                    <div className="h-3 w-40 rounded bg-blue-100" />
                    <div className="mt-2 h-3 w-56 rounded bg-blue-100" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-blue-200 bg-white px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">
                        Reorder Breakdown
                      </p>
                      <div className="space-y-1.5 text-[12px]">
                        <div className="flex items-center justify-between text-slate-700">
                          <span>📦 Current Stock in Hand</span>
                          <span className="font-bold tabular-nums">{currentStock} {item.unit ?? "units"}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span>📈 ML Predicted Demand</span>
                          <span className="font-bold tabular-nums">{predictedDemand} {item.unit ?? "units"}</span>
                        </div>
                        <div className={`mt-2 rounded-lg border px-3 py-2 ${
                          suggestedOrderQty > 0
                            ? "border-orange-200 bg-orange-50"
                            : "border-emerald-200 bg-emerald-50"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-slate-700">🛒 Suggested Order Quantity</span>
                            <span className={`text-2xl font-black tabular-nums ${
                              suggestedOrderQty > 0 ? "text-orange-700" : "text-emerald-700"
                            }`}>
                              {suggestedOrderQty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 text-[12px] font-semibold text-slate-700">
                      {`🤖 AI Forecast: You will need ${predictedDemand} ${item.unit ?? "units"} for the ${timeframe}.`}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                      Est. sales velocity ~{velocity} {item.unit ?? "units"}/day.
                      {daysLeft > 0
                        ? ` Current stock lasts ~${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`
                        : " Stock is already depleted."}
                    </p>
                    <div className={`mt-2 rounded-lg border px-3 py-2 text-[11px] font-semibold ${
                      isSafeStock
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-orange-200 bg-orange-50 text-orange-700"
                    }`}>
                      {isSafeStock
                        ? "Safe / Overstocked: current stock already covers the predicted demand. Suggested order is 0."
                        : "Urgent reorder: predicted demand exceeds current stock. Create a purchase order now."}
                    </div>
                    {forecastQuery.isError && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-700">
                        Forecast API unavailable. You can still place the order manually.
                      </p>
                    )}
                    {!forecastQuery.isError && predictedDemand === 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-700">
                        Forecast returned 0 demand. Please confirm quantity before sending.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Quantity input */}
              <div className="space-y-2">
                <label className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-700">
                  <span>Quantity to Order</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty((q) => Math.max(0, q - 1))}
                    className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xl leading-none transition-colors"
                  >−</button>
                  <input
                    type="number" min="0" value={qty}
                    onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-[15px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-400 transition-all"
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xl leading-none transition-colors"
                  >+</button>
                  <button
                    onClick={() => {
                      if (isSupplierDisabled) {
                        blockInactiveSupplier();
                        return;
                      }
                      setQty(suggestedOrderQty);
                    }}
                    disabled={isSupplierDisabled}
                    title={isSupplierDisabled ? "Cannot place order: This supplier is currently inactive" : "Apply AI Suggestion"}
                    className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-[12px] font-bold text-teal-700 hover:bg-teal-100 transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Apply AI Suggestion
                  </button>
                </div>
                <p className={`text-[11px] font-semibold ${suggestedOrderQty > 0 ? "text-orange-700" : "text-emerald-700"}`}>
                  Suggested order quantity: {suggestedOrderQty} {item.unit ?? "units"}
                </p>
              </div>
            </div>
          )}

          {/* ════ STEP 2: Supplier Contact & Email Preview ════ */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Order Summary card */}
              <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white px-4 py-3.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Order Summary</p>
                <div className="grid grid-cols-3 gap-0 text-center divide-x divide-slate-200">
                  <div className="pr-3">
                    <p className="text-[10px] font-medium text-slate-400 mb-0.5">Item</p>
                    <p className="text-[12px] font-bold text-slate-900 leading-tight line-clamp-2">{item.productName}</p>
                    {item.sku && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.sku}</p>}
                  </div>
                  <div className="px-3">
                    <p className="text-[10px] font-medium text-slate-400 mb-0.5">Quantity</p>
                    <p className="text-[22px] font-black text-slate-900 leading-tight tabular-nums">{qty}</p>
                    <p className="text-[10px] text-slate-400">{item.unit ?? "units"}</p>
                  </div>
                  <div className="pl-3">
                    <p className="text-[10px] font-medium text-slate-400 mb-0.5">Supplier</p>
                    <p className="text-[12px] font-bold text-slate-900 leading-tight line-clamp-2">
                      {assignedSupplier.companyName ?? <span className="text-slate-400 font-normal italic">Not assigned</span>}
                    </p>
                    {assignedSupplier.email && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{assignedSupplier.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Supplier — locked, read-only */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Assigned Supplier
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {!hasSupplier && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[12px] font-medium text-amber-700">
                      No supplier assigned to this product. Please assign one in the Suppliers page before placing an order.
                    </p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 mt-0.5">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 leading-tight">
                        {assignedSupplier.companyName ?? <span className="text-slate-400 italic font-normal">No supplier assigned</span>}
                      </p>
                      {assignedSupplier.email && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{assignedSupplier.email}</p>
                      )}
                    </div>
                    {hasSupplier
                      ? <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">Assigned</span>
                      : <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">Unassigned</span>
                    }
                  </div>
                </div>
              </div>

              {/* Email preview */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email Preview
                </label>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {/* Address bar */}
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 space-y-1.5">
                    {/* From — read-only with Official badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-900 w-12 shrink-0">From:</span>
                      <span className="text-[12px] text-slate-900 break-all leading-relaxed flex-1">{SYSTEM_SENDER_EMAIL}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Official
                      </span>
                    </div>
                    {/* To */}
                    <div className="flex gap-3">
                      <span className="text-[11px] font-bold text-slate-900 w-12 shrink-0 pt-px">To:</span>
                      <span className="text-[12px] text-slate-900 break-all leading-relaxed">{assignedSupplier.email || "No supplier email assigned"}</span>
                    </div>
                    {/* Subject */}
                    <div className="flex gap-3">
                      <span className="text-[11px] font-bold text-slate-900 w-12 shrink-0 pt-px">Subject:</span>
                      <span className="text-[12px] text-slate-900 break-all leading-relaxed">Purchase Order — {item.productName}</span>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="mx-4 mb-3 rounded-md border border-slate-200 bg-slate-50 p-3 max-w-full max-h-[300px] overflow-y-auto overflow-x-hidden">
                    <pre className="font-mono text-[12px] leading-[1.7] text-slate-600 whitespace-pre-wrap break-words w-full">
                      {emailBody}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0 rounded-b-2xl">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="h-10 inline-flex items-center rounded-lg border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => goTo(2)}
                className="h-10 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Next: Review Email
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => goTo(1)}
                className="h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                Back
              </button>
              <button
                onClick={() => {
                  if (isSupplierDisabled) {
                    blockInactiveSupplier();
                    return;
                  }
                  onSubmit({
                    item,
                    qty,
                    supplier: assignedSupplier,
                    emailBody,
                    timeframe,
                    predictedDemand,
                  });
                }}
                disabled={orderingBlocked || isSupplierDisabled || !hasSupplier || qty <= 0}
                title={
                  isSupplierDisabled
                    ? "Cannot place order: This supplier is currently inactive"
                    : orderingBlocked
                    ? "Ordering Blocked - Discontinued"
                    : !hasSupplier
                      ? "Assign a supplier to this product before placing an order"
                      : qty <= 0
                        ? "No reorder needed. Increase quantity only if required."
                        : undefined
                }
                className={`h-10 inline-flex items-center gap-2 rounded-lg px-5 text-[13px] font-semibold text-white shadow-sm active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none ${
                  qty > 0
                    ? "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                    : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                {isSupplierDisabled ? "Supplier Inactive" : orderingBlocked ? "Ordering Blocked - Discontinued" : `Create Purchase Order for ${qty} ${item.unit ?? "units"}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LowStockAlerts() {
  const { addReorder, setReorders } = useReorder();
  const { inventoryItems, analyticsLoading, refreshInventory } = useInventory();
  const navigate = useNavigate();

  // Fetch directly from the dedicated endpoint
  const [apiAlerts,    setApiAlerts]    = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchAlerts = useCallback(() => {
    setAlertLoading(true);
    getLowStockItems()
      .then((items) => setApiAlerts(items))
      .catch(() => setApiAlerts([]))
      .finally(() => setAlertLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Filter + search state
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");

  // Analytics derived from InventoryContext
  const contextAlerts = useMemo(
    () => inventoryItems.filter((i) =>
      i.productStatus !== "DISCONTINUED" &&
      (i.stockStatus === "LOW_STOCK" || i.stockStatus === "OUT_OF_STOCK")
    ),
    [inventoryItems]
  );
  const lowStockCount   = contextAlerts.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount = contextAlerts.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;
  const totalReorderValue = contextAlerts.reduce(
    (sum, i) => sum + Math.max(0, i.reorderLevel - i.stockQuantity) * i.sellingPrice, 0
  );

  // Source priority: API endpoint → context alerts
  const alertSource = useMemo(() => {
    if (apiAlerts.length   > 0) return apiAlerts;
    if (contextAlerts.length > 0) return contextAlerts;
    return [];
  }, [apiAlerts, contextAlerts]);

  const visibleAlerts = useMemo(() => {
    const skuQuery = search.trim() ? `PI${search.trim()}`.toLowerCase() : "";
    return alertSource
      .filter((i) => i.productStatus !== "DISCONTINUED" && i.status !== "DISCONTINUED")
      .filter((i) => statusFilter === "all" || i.stockStatus === statusFilter)
      .filter((i) => {
        const sku = String(i.sku ?? i.productId ?? i.id ?? "").toLowerCase();
        return !skuQuery || sku.includes(skuQuery);
      });
  }, [alertSource, statusFilter, search]);

  const isLoading = analyticsLoading || alertLoading;

  const [orderModal, setOrderModal] = useState(null); // null | item
  const { showToast }               = useToast();

  async function handleSubmitOrder({ item, qty, supplier, emailBody, timeframe, predictedDemand }) {
    if (supplier?.isActive === false || item.supplierActive === false || item.supplier?.isActive === false) {
      showToast("This supplier is inactive. Please enable the supplier to proceed.", "error");
      return;
    }

    if (item.productStatus === "DISCONTINUED" || item.status === "DISCONTINUED") {
      showToast("Ordering is disabled for discontinued products", "warning");
      return;
    }

    if (!supplier?.email) {
      showToast({
        type: "error",
        title: "Order Failed",
        message: "Supplier email is missing. Assign a supplier before placing an order.",
      });
      return;
    }

    const orderRef = `PO-${Date.now()}`;
    const aiOrderPayload = {
      product_id: item.productId ?? item.sku,
      quantity: qty,
      timeframe,
      predicted_demand: predictedDemand,
    };
    console.log("Order Payload:", aiOrderPayload);

    // Optimistic entry — visible on history table immediately after redirect
    const optimisticOrder = {
      id:            orderRef,
      productName:   item.productName,
      supplierName:  supplier.companyName,
      supplierEmail: supplier.email,
      quantity:      qty,
      emailBody,
      orderDate:     new Date().toISOString().slice(0, 10),
      status:        "Pending",
    };
    addReorder(optimisticOrder);

    // Build ReorderRequestDTO and include AI context for diagnostics.
    const dto = {
      orderRef,
      supplierEmail: supplier.email,
      items: [{
        productName: item.productName,
        productId:   item.productId ?? null,
        quantity:    qty,
        unitPrice:   item.sellingPrice ?? 0,
      }],
      timeframe,
      aiOrderPayload,
    };

    try {
      setOrderModal(null);
      const savedDTO = await createOrder(dto);

      // Swap optimistic entry for the real persisted record
      setReorders((prev) =>
        prev.map((o) => (o.id === orderRef ? mapHistoryItem(savedDTO) : o))
      );

      showToast({
        type: "success",
        title: "Order Placed",
        message: `Order placed for ${qty} ${item.unit ?? "units"}.`,
      });

      navigate("/reorder");
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to place order.";
      if (String(msg).toLowerCase().includes("supplier is inactive")) {
        showToast("This supplier is inactive. Please enable the supplier to proceed.", "error");
      } else if (String(msg).toLowerCase().includes("discontinued")) {
        showToast("Ordering is disabled for discontinued products", "warning");
      } else {
        showToast({ type: "error", title: "Order Failed", message: msg });
      }
      // Roll back the optimistic entry
      setReorders((prev) => prev.filter((o) => o.id !== orderRef));
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-none py-8 space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Low Stock Alerts
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Products at or below their reorder threshold — act before stock runs out.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { refreshInventory(); fetchAlerts(); }}
                disabled={isLoading}
                title="Refresh Alerts"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-teal-600 hover:border-teal-100 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* ── Analytics cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-4 sm:px-6 lg:px-8">
          <SummaryCard
            icon={AlertTriangle}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            label="Low Stock Items"
            value={analyticsLoading ? "—" : lowStockCount}
            sub="Products below reorder level"
          />
          <SummaryCard
            icon={PackageSearch}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            label="Out of Stock"
            value={analyticsLoading ? "—" : outOfStockCount}
            sub="Requires immediate reorder"
          />
          <SummaryCard
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            label="Est. Reorder Value"
            value={analyticsLoading ? "—" : formatCurrency(totalReorderValue)}
            sub="Cost to restock all alerts"
          />
        </div>

        {/* ── Filter + search ───────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="w-full rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative flex-1 min-w-0">
                <PiPrefixSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="00001"
                  onClear={() => setSearch("")}
                  className="h-10"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full sm:w-44 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {(search !== "" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="h-10 px-3 text-xs font-medium text-slate-400 hover:text-slate-700 rounded-xl shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* ── Table ────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto min-h-[400px]">
              {isLoading ? (
                <RefreshLoadingTheme
                  title="Loading Low Stock Alerts"
                  subtitle="Checking inventory risk levels..."
                />
              ) : visibleAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                  <PackageSearch className="h-10 w-10 text-slate-300 mb-1" strokeWidth={1.2} />
                  <p className="text-sm font-medium text-slate-500">
                    {alertSource.length === 0 ? "All products are well-stocked!" : "No items match your filters."}
                  </p>
                  <p className="text-xs text-slate-400">
                    {alertSource.length === 0
                      ? "No low-stock or out-of-stock alerts at the moment."
                      : "Try adjusting the filter or search term."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto transition-opacity duration-300 opacity-100">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                    {[
                      { h: "Product Name",  align: "text-left"   },
                      { h: "Category",      align: "text-left"   },
                      { h: "Current Stock", align: "text-center" },
                      { h: "Reorder Level", align: "text-center" },
                      { h: "Status",        align: "text-center" },
                      { h: "Action",        align: "text-center" },
                    ].map(({ h, align }) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-transparent whitespace-nowrap ${align}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleAlerts.map((item) => (
                    <tr
                      key={item.inventoryId}
                      className="group transition-colors duration-150 hover:bg-slate-50/60"
                    >
                      {/* Product Name */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 leading-tight">{item.productName}</p>
                        {item.sku && <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{item.sku}</p>}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[12px] font-medium text-slate-600">
                          {item.category ?? "—"}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                            item.stockQuantity === 0
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-amber-50 text-amber-600 border-amber-200"
                          }`}
                        >
                          {item.stockQuantity}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-[13px] tabular-nums font-medium text-slate-700">
                          {item.reorderLevel}{item.unit ? ` ${item.unit}` : ""}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          <StatusBadge status={item.stockStatus} />
                          {(item.supplierActive === false || item.supplier?.isActive === false) && (
                            <span
                              title="Cannot place order: This supplier is currently inactive"
                              className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                            >
                              Supplier Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            if (item.supplierActive === false || item.supplier?.isActive === false) {
                              showToast("This supplier is inactive. Please enable the supplier to proceed.", "error");
                              return;
                            }
                            if (item.productStatus === "DISCONTINUED" || item.status === "DISCONTINUED") {
                              showToast("Ordering is disabled for discontinued products", "warning");
                              return;
                            }
                            setOrderModal(item);
                          }}
                          disabled={
                            item.productStatus === "DISCONTINUED" ||
                            item.status === "DISCONTINUED" ||
                            item.supplierActive === false ||
                            item.supplier?.isActive === false
                          }
                          title={
                            item.supplierActive === false || item.supplier?.isActive === false
                              ? "Cannot place order: This supplier is currently inactive"
                              : item.productStatus === "DISCONTINUED" || item.status === "DISCONTINUED"
                              ? "Ordering Blocked - Discontinued"
                              : "Place Order"
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {item.supplierActive === false || item.supplier?.isActive === false
                            ? "Supplier Inactive"
                            : item.productStatus === "DISCONTINUED" || item.status === "DISCONTINUED"
                            ? "Ordering Blocked - Discontinued"
                            : "Place Order"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
          {/* ── Footer count ── */}
          {!isLoading && visibleAlerts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                <>Showing{" "}
                  <span className="font-semibold text-slate-700">{visibleAlerts.length}</span>
                  {" "}of{" "}
                  <span className="font-semibold text-slate-700">{alertSource.length}</span>
                  {" "}alert{alertSource.length !== 1 ? "s" : ""}
                </>
              </p>
            </div>
          )}
        </div>
        </div>

        </div>

      </main>

      {/* Place Order Modal */}
      {orderModal && (
        <PlaceOrderModal
          item={orderModal}
          onClose={() => setOrderModal(null)}
          onSubmit={handleSubmitOrder}
        />
      )}


    </div>
  );
}
