import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import {
  Package,
  ArrowLeft,
  Check,
  Mail,
  Send,
  Loader2,
  TrendingUp,
  Building2,
  ChevronRight,
  X,
  ClipboardList,
  CheckCircle,
  XCircle,
  PackageCheck,
} from "lucide-react";

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }) {
  const map = {
    LOW_STOCK:    { dot: "bg-amber-500", cls: "bg-amber-500/10 text-amber-700 border border-amber-200 dark:text-amber-400 dark:border-amber-800", label: "Low Stock"    },
    OUT_OF_STOCK: { dot: "bg-red-500",   cls: "bg-red-500/10   text-red-700   border border-red-200   dark:text-red-400   dark:border-red-800",   label: "Out of Stock" },
  };
  const s = map[status] ?? { dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function OrderStatusBadge({ status }) {
  const map = {
    Pending:   { cls: "bg-amber-500/10 text-amber-400 border border-amber-500/20",  dot: "bg-amber-400"  },
    Confirmed: { cls: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20", dot: "bg-indigo-400" },
    Received:  { cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", dot: "bg-emerald-400" },
    Cancelled: { cls: "bg-red-500/10 text-red-400 border border-red-500/20",          dot: "bg-red-400"    },
  };
  const s = map[status] ?? { cls: "bg-gray-500/10 text-gray-400 border border-gray-500/20", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Supplier Email Simulation Modal ───────────────────────────────────────
function SupplierEmailModal({ order, emailBody, onConfirm, onClose }) {
  if (!order) return null;

  // Fallback body if not supplied
  const body = emailBody || [
    `Dear ${order.supplierName},`,
    ``,
    `Please find our Purchase Order details below:`,
    `  Order ID   : ${order.id}`,
    `  Product    : ${order.productName}`,
    `  Quantity   : ${order.quantity} units`,
    `  Order Date : ${order.orderDate}`,
    ``,
    `Warm regards,`,
    `Dissanayake Super \u2014 Inventory Management Team`,
  ].join("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-700 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-100">Purchase Order Email \u2014 Sent to Supplier</p>
              <p className="text-xs text-gray-400 mt-0.5">
                The supplier received this email. Click \u201cConfirm Order\u201d below to simulate their reply.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Email meta */}
        <div className="space-y-2 border-b border-gray-700/60 px-6 py-4 shrink-0">
          {[
            { l: "From", v: "procurement@dissanayakesuper.lk" },
            { l: "To",   v: `orders@${order.supplierName.toLowerCase().replace(/\s+/g, "")}.com` },
            { l: "Subj", v: `Purchase Order \u2014 ${order.productName} (${order.id})` },
          ].map(({ l, v }) => (
            <div key={l} className="flex items-start gap-3">
              <span className="w-10 shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-500 pt-0.5">{l}</span>
              <span className="text-xs text-gray-300 break-all">{v}</span>
            </div>
          ))}
        </div>

        {/* Simulated "Supplier is viewing" banner */}
        <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 shrink-0">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs font-medium text-amber-400">
            Simulating supplier\u2019s inbox \u2014 {order.supplierName}
          </p>
        </div>

        {/* Email body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gray-300">{body}</pre>
        </div>

        {/* CTA */}
        <div className="border-t border-gray-700 px-6 py-5 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              Clicking \u201cConfirm Order\u201d simulates the supplier accepting this purchase order.
            </p>
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cancellation Overlay ────────────────────────────────────────────────────
function CancelOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/80 backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-100">Sending Cancellation Notification to Supplier...</p>
        <p className="mt-1 text-sm text-gray-400">Please wait while we notify them.</p>
      </div>
    </div>
  );
}

function StepButton({ step, label, desc, isActive, isCompleted, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150
        ${isActive
          ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
          : isCompleted
            ? "border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
        ${isActive    ? "bg-blue-600 text-white"
        : isCompleted ? "bg-emerald-500 text-white"
        :               "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}>
        {isCompleted ? <Check className="h-4 w-4" /> : step}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold
          ${isActive    ? "text-blue-700 dark:text-blue-300"
          : isCompleted ? "text-emerald-700 dark:text-emerald-400"
          :               "text-slate-700 dark:text-slate-200"}`}>
          {label}
        </p>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

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

// â”€â”€â”€ Fallback suppliers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DUMMY_SUPPLIERS = [
  { id: 1, companyName: "Araliya Rice Mills",        contactPerson: "Nihal Perera",   email: "orders@araliyarice.lk",    phone: "+94 11 234 5678" },
  { id: 2, companyName: "Edible Oils Lanka Pvt Ltd", contactPerson: "Chaminda Silva", email: "supply@edibleoils.lk",     phone: "+94 11 345 6789" },
  { id: 3, companyName: "Anchor Dairy Distributors", contactPerson: "Priya Fernando", email: "purchaseorders@anchor.lk", phone: "+94 11 456 7890" },
];

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReorderManagement() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Product injected by Low Stock Alerts via navigate state
  const [product, setProduct] = useState(location.state?.product ?? null);

  // ── Recent Purchase Orders history ──────────────────────────────────────────
  const [reorders, setReorders] = useState([
    {
      id: "PO-2025-001",
      productName: "Araliya Samba Rice 5kg",
      supplierName: "Araliya Rice Mills",
      quantity: 50,
      orderDate: "2025-02-18",
      status: "Received",
    },
    {
      id: "PO-2025-002",
      productName: "Sunflower Cooking Oil 1L",
      supplierName: "Edible Oils Lanka Pvt Ltd",
      quantity: 120,
      orderDate: "2025-02-27",
      status: "Confirmed",
    },
    {
      id: "PO-2025-003",
      productName: "Anchor Full Cream Milk Powder 400g",
      supplierName: "Anchor Dairy Distributors",
      quantity: 75,
      orderDate: "2025-03-04",
      status: "Pending",
    },
  ]);

  // â”€â”€ Steps: "config" | "email" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [step, setStep] = useState("config");

  // â”€â”€ Step A: Order Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [orderQty,         setOrderQty]         = useState(() =>
    location.state?.product
      ? Math.max(1, Math.ceil(
          (location.state.product.reorderLevel  ?? 0) -
          (location.state.product.stockQuantity ?? 0)
        ))
      : 1
  );

  // â”€â”€ Suppliers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [suppliers,        setSuppliers]        = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const fetchSuppliers = useCallback(() => {
    setSuppliersLoading(true);
    api.get("/api/suppliers")
      .then((r) => {
        const data = Array.isArray(r.data) && r.data.length > 0 ? r.data : DUMMY_SUPPLIERS;
        setSuppliers(data);
        setSelectedSupplier((prev) => prev ?? data[0]);
      })
      .catch(() => {
        setSuppliers(DUMMY_SUPPLIERS);
        setSelectedSupplier((prev) => prev ?? DUMMY_SUPPLIERS[0]);
      })
      .finally(() => setSuppliersLoading(false));
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // â”€â”€ Step B: Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [emailBody,    setEmailBody]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent,         setSent]         = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Per-row loading: { [orderId]: 'confirming' | 'cancelling' | false }
  const [rowLoading, setRowLoading] = useState({});

  // ── Supplier email modal  (null | { order })
  const [supplierEmailModal, setSupplierEmailModal] = useState(null);

  // ── Cancellation overlay  (null | { orderId })
  const [cancelOverlay, setCancelOverlay] = useState(null);

  // â”€â”€ Stock preview calc â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const expectedStock = (product?.stockQuantity ?? 0) + (orderQty ?? 0);
  const scaleMax      = Math.max(expectedStock, (product?.reorderLevel ?? 10)) * 1.5 || 100;
  const currentPct    = product ? Math.min(100, ((product.stockQuantity ?? 0) / scaleMax) * 100) : 0;
  const expectedPct   = Math.min(100, (expectedStock / scaleMax) * 100);
  const reorderPct    = product ? Math.min(100, ((product.reorderLevel ?? 0) / scaleMax) * 100) : 0;

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handlePrepareEmail() {
    if (!product || !selectedSupplier) return;
    setEmailBody([
      `Dear ${selectedSupplier.contactPerson},`,
      ``,
      `I hope this message finds you well. We are writing from Dissanayake Super to place a formal purchase order for the following product:`,
      ``,
      `  Product   :  ${product.productName}`,
      `  SKU       :  ${product.sku ?? "N/A"}`,
      `  Category  :  ${product.category ?? "N/A"}`,
      `  Quantity  :  ${orderQty} ${product.unit ?? "units"}`,
      ``,
      `Current stock level is ${product.stockQuantity} ${product.unit ?? "units"}, which is at or below our reorder threshold of ${product.reorderLevel} ${product.unit ?? "units"}.`,
      ``,
      `Please confirm stock availability and the expected delivery date at your earliest convenience.`,
      ``,
      `Warm regards,`,
      `Dissanayake Super â€” Inventory Management Team`,
    ].join("\n"));
    setStep("email");
  }

  function handleCreateReorder(e) {
    e?.preventDefault();
    if (!product || !selectedSupplier || isSubmitting) return;

    setIsSubmitting(true);
    setSending(true);

    // Capture the email body now before it gets cleared
    const capturedEmailBody = emailBody;

    setTimeout(() => {
      // Build the new history entry
      const newOrder = {
        id:           `PO-${Date.now()}`,
        productName:  product.productName,
        supplierName: selectedSupplier.companyName,
        quantity:     orderQty,
        orderDate:    new Date().toISOString().slice(0, 10),
        status:       "Pending",
      };

      // Prepend to history table
      setReorders((prev) => [newOrder, ...prev]);

      // Show the Supplier Email Simulation modal with the actual email body
      setSupplierEmailModal({ order: newOrder, emailBody: capturedEmailBody });

      // Mark sent & show toast
      setSending(false);
      setIsSubmitting(false);
      setSent(true);
      setToast(`Purchase Order sent to ${selectedSupplier.email} successfully!`);
      setTimeout(() => setToast(null), 4500);

      // Reset form fields
      setEmailBody("");
    }, 1500);
  }

  // Keep legacy alias so existing JSX call-sites still work
  const handleSend = handleCreateReorder;

  // ── Row-level action handlers ──────────────────────────────────────────

  // Opens the supplier email simulation modal
  function handleConfirmOrder(id) {
    if (rowLoading[id]) return;
    const order = reorders.find((o) => o.id === id);
    if (order) setSupplierEmailModal({ order });
  }

  // Called when user clicks "Confirm Order" inside the email modal
  function handleSupplierConfirm() {
    const id = supplierEmailModal?.order?.id;
    setSupplierEmailModal(null);
    if (!id) return;
    setReorders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Confirmed" } : o))
    );
    // If triggered from the Send flow (sent=true), reset back to config
    // so the user can see the updated history table
    setSent(false);
    setStep("config");
    setProduct(null);
    setToast("Supplier confirmed the order! Status updated to Confirmed.");
    setTimeout(() => setToast(null), 4000);
  }

  // Shows confirmation prompt, then displays cancellation overlay for 2 s
  function handleCancelOrder(id) {
    if (rowLoading[id]) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelOverlay({ orderId: id });
    setTimeout(() => {
      setReorders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Cancelled" } : o))
      );
      setCancelOverlay(null);
      setToast("Cancellation notification sent to supplier.");
      setTimeout(() => setToast(null), 3500);
    }, 2000);
  }

  function handleMarkAsReceived(id) {
    if (rowLoading[id]) return;
    setReorders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Received" } : o))
    );
    setToast("Stock Updated Successfully!");
    setTimeout(() => setToast(null), 3500);
  }

  function handleReset() {
    setProduct(null);
    setSent(false);
    setEmailBody("");
    setStep("config");
    navigate("/low-stock");
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <div className="flex-1 overflow-y-auto space-y-6 px-4 sm:px-6 py-6">

        {/* Heading */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-50 shrink-0">
            <Package className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
              Reorder Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Configure a purchase order and send it directly to your supplier.
            </p>
          </div>
        </div>

        {/* â”€â”€ Step pill nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <StepButton
            step={1} label="Order Details" desc="Product, quantity &amp; supplier"
            isActive={step === "config"}
            isCompleted={step === "email"}
            onClick={() => { if (product) setStep("config"); }}
          />
          <ChevronRight className="hidden h-5 w-5 shrink-0 self-center text-slate-300 dark:text-slate-600 sm:block" />
          <StepButton
            step={2} label="Supplier Communication" desc="Review &amp; send the email"
            isActive={step === "email"}
            isCompleted={sent}
            onClick={() => { if (product && step === "email") setStep("email"); }}
          />
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            NO PRODUCT SELECTED
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {!product && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-24 text-center">
            <Package className="h-14 w-14 text-slate-300 dark:text-slate-700" strokeWidth={1.2} />
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">No product selected</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Go to <strong>Low Stock Alerts</strong> and click "Prepare Order" on a product to start.
              </p>
            </div>
            <button
              onClick={() => navigate("/low-stock")}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-500/20 dark:focus:ring-offset-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              View Low Stock Alerts
            </button>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            STEP 1 â€” ORDER DETAILS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {product && step === "config" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* â”€â”€ Left col â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-5">

              {/* Product info */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Selected Product
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-50">
                      {product.productName}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>{product.category ?? "â€”"}</span>
                      {product.sku && <><span>Â·</span><span className="font-mono text-xs">{product.sku}</span></>}
                    </div>
                  </div>
                  <StatusBadge status={product.stockStatus} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Current Stock</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${
                      product.stockStatus === "OUT_OF_STOCK"
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {product.stockQuantity}
                      <span className="ml-1 text-sm font-normal text-slate-400 dark:text-slate-500">
                        {product.unit ?? "units"}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Reorder Level</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                      {product.reorderLevel}
                      <span className="ml-1 text-sm font-normal text-slate-400 dark:text-slate-500">
                        {product.unit ?? "units"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Quantity */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Order Quantity
                  <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">
                    (suggested: {Math.max(1, Math.ceil((product.reorderLevel ?? 0) - (product.stockQuantity ?? 0)))} {product.unit ?? "units"})
                  </span>
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-50 text-lg font-bold text-blue-700 transition-all hover:border-blue-500 hover:bg-blue-100 active:scale-95 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-800/50"
                  >âˆ’</button>
                  <input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 rounded-lg border border-blue-200 bg-background px-3 py-2 text-center text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-blue-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => setOrderQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-50 text-lg font-bold text-blue-700 transition-all hover:border-blue-500 hover:bg-blue-100 active:scale-95 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-800/50"
                  >+</button>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {product.unit ?? "units"}
                  </span>
                </div>
              </div>
            </div>

            {/* â”€â”€ Right col â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-5">

              {/* Stock Preview */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Stock After Order = {product.stockQuantity} + {orderQty} = <span className="text-emerald-600 dark:text-emerald-400">{expectedStock}</span>
                  </h3>
                </div>

                <div className="mb-6 flex items-center justify-around gap-2">
                  {/* Current */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-14 w-16 items-center justify-center rounded-xl text-xl font-bold tabular-nums ${
                      product.stockQuantity === 0
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}>
                      {product.stockQuantity}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Current</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">+</div>
                    <p className="text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">{orderQty}</p>
                  </div>
                  {/* Expected */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      {expectedStock}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Expected</p>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>Current stock</span>
                      <span className="tabular-nums">{product.stockQuantity} {product.unit ?? "units"}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${product.stockQuantity === 0 ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.max(2, currentPct)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>After reorder</span>
                      <span className="tabular-nums">{expectedStock} {product.unit ?? "units"}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, expectedPct)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Reorder threshold:{" "}
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {product.reorderLevel} {product.unit ?? "units"}
                    </span>
                    {expectedStock >= product.reorderLevel && (
                      <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">âœ“ Will meet threshold</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Supplier Information</h3>
                </div>

                {suppliersLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-slate-400 dark:text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading suppliers…
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedSupplier?.id ?? ""}
                      onChange={(e) =>
                        setSelectedSupplier(suppliers.find((s) => s.id === parseInt(e.target.value)) ?? null)
                      }
                      className="mb-4 w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 focus:border-slate-400 dark:focus:border-slate-600 transition-all duration-200 cursor-pointer"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.companyName}</option>
                      ))}
                    </select>

                    {selectedSupplier && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Company</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{selectedSupplier.companyName}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Contact</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{selectedSupplier.contactPerson}</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Email</p>
                          <p className="mt-0.5 text-sm font-medium text-blue-600 dark:text-blue-400">{selectedSupplier.email}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action row for Step 1 */}
        {product && step === "config" && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={() => navigate("/low-stock")}
              className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Alerts
            </button>
            <button
              onClick={handlePrepareEmail}
              disabled={!selectedSupplier}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-500/20 dark:focus:ring-offset-gray-900"
            >
              <Mail className="h-4 w-4" />
              Prepare Email
            </button>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            STEP 2 â€” EMAIL COMPOSE
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {product && step === "email" && (
          <div className="space-y-5">
            {sent ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 py-16 text-center dark:border-emerald-800/50 dark:bg-emerald-950/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                  <Check className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Email Sent!</p>
                  <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-500">
                    Purchase order for <strong>{product.productName}</strong> sent to{" "}
                    <strong>{selectedSupplier?.email}</strong>.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-500/20 dark:focus:ring-offset-gray-950"
                >
                  â† New Reorder
                </button>
              </div>
            ) : (
              /* Email compose */
              <div className="mx-auto max-w-3xl">
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  {/* Header bar */}
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Purchase Order Email</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Review and send to supplier</p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    {/* To */}
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 px-4 py-2.5">
                      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">To</span>
                      <span className="text-sm text-slate-700 dark:text-slate-200">{selectedSupplier?.email ?? "—"}</span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 px-4 py-2.5">
                      <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Subject</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Purchase Order for {product.productName}
                      </span>
                    </div>

                    {/* Body */}
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Message
                      </label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={14}
                        className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 focus:border-slate-400 dark:focus:border-slate-600 transition-all duration-200"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button
                        onClick={() => setStep("config")}
                        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75 dark:bg-blue-600 dark:hover:bg-blue-500 dark:shadow-blue-500/20 dark:focus:ring-offset-gray-800"
                      >
                        {sending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sendingâ€¦</>
                          : <><Send className="h-4 w-4" /> Send Order via Email</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            RECENT PURCHASE ORDERS HISTORY
        ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 shadow-lg overflow-hidden">

          {/* Section header */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-700/60">
                <ClipboardList className="h-4 w-4 text-gray-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-100">Recent Purchase Orders</h2>
                <p className="text-xs text-gray-400 mt-0.5">History of orders placed through this system</p>
              </div>
            </div>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-700/60 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
              {reorders.length} orders
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/40">
                  {["Order ID", "Product", "Supplier", "Qty", "Order Date", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {reorders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`transition-colors hover:bg-gray-700/30 ${
                      idx % 2 === 0 ? "bg-transparent" : "bg-gray-800/30"
                    }`}
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gray-300 whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-100">{order.productName}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">
                      {order.supplierName}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-gray-200 font-semibold whitespace-nowrap">
                      {order.quantity}
                    </td>
                    <td className="px-5 py-4 tabular-nums text-gray-400 whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {/* Pending: Confirm + Cancel */}
                      {order.status === "Pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            title="Open Supplier Email Simulation"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/20 transition-all hover:bg-blue-500/20 hover:text-blue-300"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Simulate Email
                          </button>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            title="Cancel Order"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 transition-all hover:bg-red-500/20 hover:text-red-300"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      )}

                      {/* Confirmed: Mark as Received */}
                      {order.status === "Confirmed" && (
                        <button
                          onClick={() => handleMarkAsReceived(order.id)}
                          title="Mark as Received"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          Mark Received
                        </button>
                      )}

                      {/* Received / Cancelled: finalized — no actions */}
                      {(order.status === "Received" || order.status === "Cancelled") && (
                        <span className="text-xs text-gray-600 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state (hidden when there are rows, kept for completeness) */}
          {reorders.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ClipboardList className="h-10 w-10 text-gray-600" strokeWidth={1.2} />
              <p className="text-sm font-medium text-gray-400">No purchase orders yet</p>
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* Supplier Email Simulation Modal */}
      <SupplierEmailModal
        order={supplierEmailModal?.order ?? null}
        emailBody={supplierEmailModal?.emailBody ?? ""}
        onConfirm={handleSupplierConfirm}
        onClose={() => setSupplierEmailModal(null)}
      />

      {/* Cancellation Overlay */}
      {cancelOverlay && <CancelOverlay />}
    </div>
  );
}
