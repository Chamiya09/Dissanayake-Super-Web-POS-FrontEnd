import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import { useInventory } from "@/context/InventoryContext";
import { useReorder }   from "@/context/ReorderContext";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  AlertTriangle,
  PackageSearch,
  RefreshCw,
  DollarSign,
  ArrowRight,
  X,
  Check,
  ShoppingCart,
  Mail,
  Send,
  TrendingUp,
  Building2,
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
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Toast notification ─────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-4 text-white shadow-2xl">
      <Check className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Modal suppliers (mirrors ReorderManagement fallback list) ───────────────

const MODAL_SUPPLIERS = [
  { id: 1, companyName: "Araliya Rice Mills",        contactPerson: "Nihal Perera",   email: "orders@araliyarice.lk"    },
  { id: 2, companyName: "Edible Oils Lanka Pvt Ltd", contactPerson: "Chaminda Silva", email: "supply@edibleoils.lk"     },
  { id: 3, companyName: "Anchor Dairy Distributors", contactPerson: "Priya Fernando", email: "purchaseorders@anchor.lk" },
];

// ─── Place-Order Modal (Two-Step Wizard) ────────────────────────────────────

function PlaceOrderModal({ item, onClose, onSubmit }) {
  const aiQty    = Math.max(1, Math.ceil((item.reorderLevel ?? 0) * 1.5 - (item.stockQuantity ?? 0)));
  const [step, setStep]           = useState(1);
  const [qty,  setQty]            = useState(aiQty);
  const [supplier, setSupplier]   = useState(MODAL_SUPPLIERS[0]);

  const gap      = Math.max(0, (item.reorderLevel ?? 0) - (item.stockQuantity ?? 0));
  const velocity = Math.max(1, Math.round((item.reorderLevel ?? 10) / 3));
  const daysLeft = item.stockQuantity > 0 ? Math.floor(item.stockQuantity / velocity) : 0;
  const stockPct = Math.min(100, ((item.stockQuantity ?? 0) / Math.max(1, item.reorderLevel ?? 1)) * 100);

  const emailBody = [
    `Dear ${supplier.contactPerson},`,
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
    `Warm regards,`,
    `Dissanayake Super — Inventory Management Team`,
    `procurement@dissanayakesuper.lk`,
  ].join("\n");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shrink-0">
              <ShoppingCart className="h-[16px] w-[16px] text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-950 leading-tight">
                Place Purchase Order
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                {item.productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-200 hover:text-slate-950 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 shrink-0">
          {[
            { n: 1, label: "Reorder Details" },
            { n: 2, label: "Supplier & Email" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-0">
              {i > 0 && (
                <div className={`h-px w-8 mx-2 transition-colors ${step > 1 ? "bg-blue-600" : "bg-slate-200"}`} />
              )}
              <div className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                  step === n
                    ? "bg-blue-600 text-white"
                    : step > n
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {step > n ? "✓" : n}
                </div>
                <span className={`text-[12px] font-semibold transition-colors ${
                  step === n ? "text-slate-900" : step > n ? "text-blue-600" : "text-slate-400"
                }`}>
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ════ STEP 1: Reorder Details & AI Insight ════ */}
          {step === 1 && (
            <div className="space-y-5">

              {/* Product summary row */}
              <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 mt-0.5">
                  <PackageSearch className="h-4 w-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{item.productName}</p>
                  {item.sku && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.sku}</p>}
                  {item.category && <p className="text-[11px] text-slate-400">{item.category}</p>}
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
                    bg: item.stockQuantity === 0 ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100",
                  },
                  {
                    label: "Reorder Level",
                    value: `${item.reorderLevel ?? 0}`,
                    unit: item.unit ?? "units",
                    color: "text-slate-700",
                    bg: "bg-slate-50 border-slate-100",
                  },
                  {
                    label: "Shortage",
                    value: `${gap}`,
                    unit: item.unit ?? "units",
                    color: "text-orange-600",
                    bg: "bg-orange-50 border-orange-100",
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
              <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">
                    AI Recommended Quantity
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-1.5">
                  <span className="text-4xl font-black text-slate-900 leading-none">{aiQty}</span>
                  <span className="text-sm text-slate-500 pb-0.5">{item.unit ?? "units"}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Est. sales velocity ~{velocity} {item.unit ?? "units"}/day.
                  {daysLeft > 0
                    ? ` Current stock lasts ~${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`
                    : " Stock is already depleted."}
                  {" "}This quantity covers ~45 days of demand.
                </p>
              </div>

              {/* Quantity input */}
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-700">
                  Quantity to Order
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xl leading-none transition-colors"
                  >−</button>
                  <input
                    type="number" min="1" value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-[15px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xl leading-none transition-colors"
                  >+</button>
                  <button
                    onClick={() => setQty(aiQty)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[12px] font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Use AI ({aiQty})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 2: Supplier Contact & Email Preview ════ */}
          {step === 2 && (
            <div className="space-y-5">

              {/* Summary chip */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="text-[12px] text-slate-500">Ordering</span>
                <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[12px] font-bold text-white">{qty} {item.unit ?? "units"}</span>
                <span className="text-[12px] text-slate-500">of <span className="font-semibold text-slate-700">{item.productName}</span></span>
              </div>

              {/* Supplier selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Select Supplier
                </label>
                <div className="space-y-2">
                  {MODAL_SUPPLIERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSupplier(s)}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                        supplier.id === s.id
                          ? "border-blue-400 bg-blue-50 ring-1 ring-blue-300"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${supplier.id === s.id ? "bg-blue-600" : "bg-slate-300"}`} />
                        <div>
                          <p className={`text-[13px] font-semibold ${supplier.id === s.id ? "text-blue-700" : "text-slate-800"}`}>
                            {s.companyName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{s.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
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
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 space-y-1">
                    {[
                      { l: "To",      v: supplier.email },
                      { l: "From",    v: "procurement@dissanayakesuper.lk" },
                      { l: "Subject", v: `Purchase Order — ${item.productName}` },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex gap-3">
                        <span className="text-[11px] font-bold text-slate-400 w-12 shrink-0 pt-px">{l}:</span>
                        <span className="text-[12px] text-slate-600 break-all leading-relaxed">{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Body */}
                  <pre className="px-4 py-3 text-[12px] leading-[1.7] text-slate-700 font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {emailBody}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 shrink-0">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="h-9 px-5 text-[13px] font-semibold rounded-lg border-2 border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="h-9 inline-flex items-center gap-2 px-5 text-[13px] font-extrabold rounded-lg bg-slate-900 border border-slate-950 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Next: Review Email
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="h-9 px-5 text-[13px] font-semibold rounded-lg border-2 border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 hover:border-slate-400 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => onSubmit({ item, qty, supplier, emailBody })}
                className="h-9 inline-flex items-center gap-2 px-5 text-[13px] font-extrabold rounded-lg bg-slate-900 border border-slate-950 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2"
              >
                <Send className="h-3.5 w-3.5" />
                Send Purchase Order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const DUMMY_ALERTS = [
  { inventoryId: -1, productId: -1, productName: "Basmati Rice (5 kg)",           sku: "RCE-001", category: "Dry Goods",   stockQuantity: 4,  reorderLevel: 20, unit: "bags",    stockStatus: "LOW_STOCK",    sellingPrice: 1250 },
  { inventoryId: -2, productId: -2, productName: "Sunflower Cooking Oil (1 L)",    sku: "OIL-002", category: "Oils & Fats",  stockQuantity: 0,  reorderLevel: 15, unit: "bottles", stockStatus: "OUT_OF_STOCK", sellingPrice: 480  },
  { inventoryId: -3, productId: -3, productName: "Full Cream Milk Powder (400 g)", sku: "MLK-003", category: "Dairy",        stockQuantity: 7,  reorderLevel: 25, unit: "tins",    stockStatus: "LOW_STOCK",    sellingPrice: 890  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LowStockAlerts() {
  const { addReorder } = useReorder();
  const { inventoryItems, analyticsLoading, refreshInventory } = useInventory();
  const navigate = useNavigate();

  // Fetch directly from the dedicated endpoint
  const [apiAlerts,    setApiAlerts]    = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);

  const fetchAlerts = useCallback(() => {
    setAlertLoading(true);
    api.get("/api/inventory/low-stock")
      .then((r) => setApiAlerts(r.data ?? []))
      .catch(() => setApiAlerts([]))
      .finally(() => setAlertLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Filter + search state
  const [statusFilter, setStatusFilter] = useState("all");
  const [search,       setSearch]       = useState("");

  // Analytics derived from InventoryContext
  const contextAlerts = useMemo(
    () => inventoryItems.filter((i) => i.stockStatus === "LOW_STOCK" || i.stockStatus === "OUT_OF_STOCK"),
    [inventoryItems]
  );
  const lowStockCount   = contextAlerts.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStockCount = contextAlerts.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;
  const totalReorderValue = contextAlerts.reduce(
    (sum, i) => sum + Math.max(0, i.reorderLevel - i.stockQuantity) * i.sellingPrice, 0
  );

  // Source priority: API endpoint → context alerts → dummy data
  const alertSource = useMemo(() => {
    if (apiAlerts.length   > 0) return apiAlerts;
    if (contextAlerts.length > 0) return contextAlerts;
    return DUMMY_ALERTS;
  }, [apiAlerts, contextAlerts]);

  const isDummy = alertSource === DUMMY_ALERTS;

  const visibleAlerts = useMemo(() => {
    return alertSource
      .filter((i) => statusFilter === "all" || i.stockStatus === statusFilter)
      .filter((i) => {
        const q = search.trim().toLowerCase();
        return !q || i.productName.toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q);
      });
  }, [alertSource, statusFilter, search]);

  const isLoading = analyticsLoading || alertLoading;

  const [orderModal, setOrderModal] = useState(null); // null | item
  const [toast,      setToast]      = useState(null);

  function handleSubmitOrder({ item, qty, supplier, emailBody }) {
    const newOrder = {
      id:            `PO-${Date.now()}`,
      productName:   item.productName,
      supplierName:  supplier.companyName,
      supplierEmail: supplier.email,
      quantity:      qty,
      emailBody,
      orderDate:     new Date().toISOString().slice(0, 10),
      status:        "Pending",
    };

    // 1. Push data to shared context FIRST — visible immediately on redirect
    addReorder(newOrder);

    // 2. Close modal instantly
    setOrderModal(null);

    // 3. Show success toast
    setToast("Order Placed Successfully! Redirecting...");

    // 4. Navigate to Reorder Management after a short delay so the user
    //    can read the confirmation message before the view changes
    setTimeout(() => {
      navigate("/reorder");
    }, 900);
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <AppHeader />

      <div className="flex-1 overflow-y-auto space-y-6 px-4 sm:px-6 py-6">

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                Low Stock Alerts
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Products at or below their reorder threshold — act before stock runs out.
              </p>
            </div>
          </div>
          <button
            onClick={() => { refreshInventory(); fetchAlerts(); }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 self-start shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* ── Analytics cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {[{ k: "all", l: "All" }, { k: "LOW_STOCK", l: "Low Stock" }, { k: "OUT_OF_STOCK", l: "Out of Stock" }].map((t) => (
              <button
                key={t.k}
                onClick={() => setStatusFilter(t.k)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-150 ${
                  statusFilter === t.k
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <input
              type="text"
              placeholder="Search by product or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-300 transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="ml-auto h-4 w-28 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
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
                        className={`px-6 py-3.5 text-[11px] font-black uppercase tracking-wider text-slate-600 whitespace-nowrap ${align}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleAlerts.map((item, idx) => (
                    <tr
                      key={item.inventoryId}
                      className={`transition-colors duration-150 hover:bg-blue-50/50 ${
                        idx % 2 !== 0 ? "bg-slate-50/50" : "bg-white"
                      }`}
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
                        <StatusBadge status={item.stockStatus} />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setOrderModal(item)}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Place Order
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ── Footer count ── */}
          {!isLoading && visibleAlerts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {isDummy ? "Showing sample data — live inventory not yet available." : (
                  <>Showing{" "}
                    <span className="font-semibold text-slate-700">{visibleAlerts.length}</span>
                    {" "}of{" "}
                    <span className="font-semibold text-slate-700">{alertSource.length}</span>
                    {" "}alert{alertSource.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Row count / source note — keep as spacing only when no footer shown */}
        {!isLoading && visibleAlerts.length === 0 && (
          <p className="text-[12px] text-slate-400">
            {isDummy ? "Showing sample data — live inventory not yet available." : ""}
          </p>
        )}

      </div>

      {/* Place Order Modal */}
      {orderModal && (
        <PlaceOrderModal
          item={orderModal}
          onClose={() => setOrderModal(null)}
          onSubmit={handleSubmitOrder}
        />
      )}

      {/* Success toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
