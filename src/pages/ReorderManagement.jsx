import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/Layout/AppHeader";
import api from "@/lib/axiosInstance";
import { createOrder, getHistory, mapHistoryItem, updateOrder, updateOrderStatus } from "@/api/reorderApi";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { generatePurchaseOrderPDF } from "@/utils/generatePurchaseOrderPDF";
import { useReorder }      from "@/context/ReorderContext";
import { useAuth }         from "@/context/AuthContext";
import { useToast } from "@/context/GlobalToastContext";
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
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  CheckCircle,
  XCircle,
  PackageCheck,
  Search,
  FileDown,
} from "lucide-react";

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


const SYSTEM_SENDER_EMAIL = "dissanayakesupers.orders@gmail.com";

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

function OrderStatusBadge({ status }) {
  const map = {
    Pending:   { cls: "bg-amber-50 text-amber-700 border border-amber-200",    dot: "bg-amber-500"   },
    Confirmed: { cls: "bg-blue-50 text-blue-700 border border-blue-200",     dot: "bg-blue-500"   },
    Received:  { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
    Cancelled: { cls: "bg-red-50 text-red-600 border border-red-200",            dot: "bg-red-500"    },
  };
  const s = map[status] ?? { cls: "bg-slate-100 text-slate-600 border border-slate-200", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Supplier Email Simulation Modal ───────────────────────────────────────
function SupplierEmailModal({ order, emailBody, viewOnly = false, onConfirm, onClose }) {
  const { user } = useAuth();
  const managerName = user?.name ?? "Store Manager";

  if (!order) return null;

  const body = emailBody || [
    `Dear ${order.supplierName},`,
    ``,
    `Please find our Purchase Order details below:`,
    ``,
    `  Order ID   : ${order.id}`,
    `  Product    : ${order.productName}`,
    `  Quantity   : ${order.quantity} ${order.unit ?? "units"}`,
    `  Order Date : ${order.orderDate}`,
    ``,
    `Please confirm stock availability and expected delivery date.`,
    ``,
    `Regards,`,
    `${managerName}`,
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
        className="absolute inset-0 bg-slate-900/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shrink-0">
              <Mail className="h-[18px] w-[18px] text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {viewOnly ? "Order Details" : "Connect Supplier"}
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {viewOnly
                  ? "Read-only preview of the purchase order email."
                  : "Review the email sent to the supplier, then confirm below."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Simulation banner — supplier-confirmation mode only */}
        {!viewOnly && (
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2.5 shrink-0">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="text-[12px] font-semibold text-amber-700">
              Simulating supplier's inbox — {order.supplierName}
            </p>
          </div>
        )}

        {/* Email card */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Address bar */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100 overflow-hidden">
            {/* From — read-only with Official badge */}
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-[11px] font-bold text-slate-900 w-14 shrink-0">From:</span>
              <span className="text-[12px] text-slate-900 break-all leading-relaxed flex-1">{SYSTEM_SENDER_EMAIL}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Official
              </span>
            </div>
            {/* To */}
            <div className="flex gap-3 px-4 py-2.5">
              <span className="text-[11px] font-bold text-slate-900 w-14 shrink-0 pt-px">To:</span>
              <span className="text-[12px] text-slate-900 break-all leading-relaxed">{order.supplierEmail ?? "—"}</span>
            </div>
            {/* Subject */}
            <div className="flex gap-3 px-4 py-2.5">
              <span className="text-[11px] font-bold text-slate-900 w-14 shrink-0 pt-px">Subject:</span>
              <span className="text-[12px] text-slate-900 break-all leading-relaxed">{`Purchase Order — ${order.productName} (${order.id})`}</span>
            </div>
          </div>

          {/* Body */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 max-w-full max-h-[300px] overflow-y-auto overflow-x-hidden">
            <pre className="font-mono text-[12px] leading-[1.75] text-slate-600 whitespace-pre-wrap break-words w-full">
              {body}
            </pre>
          </div>
        </div>

        {/* Footer */}
        {viewOnly ? (
          <div className="flex items-center justify-end border-t border-slate-100 bg-white px-5 py-4 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 shrink-0">
            <p className="text-[12px] text-slate-500 leading-snug">
              Clicking <strong className="text-slate-700">Confirm Order</strong> simulates the supplier
              accepting this PO — the status will update to <strong className="text-indigo-600">Confirmed</strong>.
            </p>
            <button
              onClick={onConfirm}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// ─── Edit Order Modal ──────────────────────────────────────────────────────────
function EditOrderModal({ order, onUpdate, onClose }) {
  const { user } = useAuth();
  const managerName = user?.name ?? "Store Manager";

  const [qty, setQty] = useState(order.quantity ?? 1);
  const [email, setEmail] = useState(order.supplierEmail ?? "");

  const defaultMessage = [
    `Dear ${order.supplierName},`,
    ``,
    `We would like to submit a revised Purchase Order (${order.id}) with the following updated details:`,
    ``,
    `  Product    : ${order.productName}`,
    `  Quantity   : (see updated quantity above)`,
    `  Order Date : ${order.orderDate}`,
    ``,
    `Please confirm the revised order at your earliest convenience.`,
    ``,
    `Regards,`,
    `${managerName}`,
    `Purchasing Department`,
    `Dissanayake Super Inventory System`,
    ``,
    `---`,
    `This is an automated purchase order sent via Dissanayake Super Management System (Gmail Integration).`,
  ].join("\n");

  const [message, setMessage] = useState(order.emailBody || defaultMessage);

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

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 shrink-0">
              <Pencil className="h-[16px] w-[16px] text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-950 leading-tight">Edit Purchase Order</h2>
              <p className="text-[12px] text-slate-500 mt-0.5 truncate max-w-[240px]">{order.productName}</p>
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

        {/* Order meta strip */}
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</p>
            <p className="text-[12px] font-mono text-slate-600 mt-0.5">{order.id}</p>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Supplier</p>
            <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{order.supplierName}</p>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</p>
            <p className="text-[12px] text-slate-600 mt-0.5">{order.orderDate}</p>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Quantity */}
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
                className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-[15px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xl leading-none transition-colors"
              >+</button>
            </div>
          </div>

          {/* Supplier Email */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-slate-700">
              Supplier Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supplier@example.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Supplier message */}
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-slate-700">
              Supplier Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-mono leading-[1.7] text-slate-700 caret-black outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 shrink-0">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
          onClick={() => onUpdate({ id: order.id, dbId: order.dbId, qty, email, message, items: order.items })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-950 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            <Send className="h-3.5 w-3.5" />
            Update Purchase Order
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Cancellation Overlay ────────────────────────────────────────────────────
function CancelOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-950 border-2 border-red-700">
        <Loader2 className="h-8 w-8 animate-spin text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-white">Sending Cancellation Notice to Supplier...</p>
        <p className="mt-1 text-sm text-slate-400">Please wait while we notify them.</p>
      </div>
    </div>
  );
}

function UpdateOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 border-2 border-indigo-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-white">Sending Updated Purchase Order to Supplier...</p>
        <p className="mt-1 text-sm text-slate-400">Please wait while we resend the order.</p>
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
          ? "border-teal-500 bg-teal-50"
          : isCompleted
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
        ${isActive    ? "bg-teal-600 text-white"
        : isCompleted ? "bg-emerald-500 text-white"
        :               "bg-slate-100 text-slate-500"}`}>
        {isCompleted ? <Check className="h-4 w-4" /> : step}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold
          ${isActive    ? "text-blue-700"
          : isCompleted ? "text-emerald-700"
          :               "text-foreground"}`}>
          {label}
        </p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

// â”€â”€â”€ Fallback suppliers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const DUMMY_SUPPLIERS = [
  { id: 1, companyName: "Araliya Rice Mills",        contactPerson: "Nihal Perera",   email: "orders@araliyarice.lk",    phone: "+94 11 234 5678" },
  { id: 2, companyName: "Edible Oils Lanka Pvt Ltd", contactPerson: "Chaminda Silva", email: "supply@edibleoils.lk",     phone: "+94 11 345 6789" },
  { id: 3, companyName: "Anchor Dairy Distributors", contactPerson: "Priya Fernando", email: "purchaseorders@anchor.lk", phone: "+94 11 456 7890" },
];

// ── Components ─────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReorderManagement() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const managerName = user?.name ?? "Store Manager";

  // Product injected by Low Stock Alerts via navigate state
  const [product, setProduct] = useState(location.state?.product ?? null);

  // ── Recent Purchase Orders — live via ReorderContext ───────────────────────
  const { reorders, setReorders } = useReorder();

  // -- History: fetch from API on mount
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback((currentSuppliers = []) => {
    setHistoryLoading(true);
    getHistory(currentSuppliers)
      .then((orders) => setReorders(orders))
      .catch(() => { /* keep optimistic entries on error */ })
      .finally(() => setHistoryLoading(false));
  }, [setReorders]);

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
        setSelectedSupplier((prev) => {
          if (prev) return prev;
          // Auto-select the supplier that matches the product's assigned supplierEmail
          const productEmail = location.state?.product?.supplierEmail;
          if (productEmail) {
            const match = data.find((s) => s.email === productEmail);
            if (match) return match;
          }
          return data[0];
        });
      })
      .catch(() => {
        setSuppliers(DUMMY_SUPPLIERS);
        setSelectedSupplier((prev) => prev ?? DUMMY_SUPPLIERS[0]);
      })
      .finally(() => setSuppliersLoading(false));
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // Fetch order history once (after component mounts); re-uses supplier list
  // for display-name resolution once suppliers have loaded.
  useEffect(() => {
    fetchHistory(suppliers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [emailBody,    setEmailBody]    = useState("");
  const [sending,      setSending]      = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent,         setSent]         = useState(false);
  const { showToast }                    = useToast();

  // ── Per-row loading: { [orderId]: 'confirming' | 'cancelling' | false }
  const [rowLoading, setRowLoading] = useState({});

  // ── Supplier email modal  (null | { order })
  const [supplierEmailModal, setSupplierEmailModal] = useState(null);

  // ── Cancellation overlay  (null | { orderId })
  const [cancelOverlay, setCancelOverlay] = useState(null);

  // ── Search & filter
  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredReorders = reorders.filter((o) => {
    const matchesSearch = o.supplierName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Inline cancel confirmation: which order.id is awaiting confirm
  const [cancelConfirmId, setCancelConfirmId] = useState(null);

  // ── Edit order modal (null | order)
  const [editOrderModal, setEditOrderModal] = useState(null);

  // ── Update overlay
  const [updateOverlay, setUpdateOverlay] = useState(false);

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
      `Regards,`,
      `${managerName}`,
      `Purchasing Department`,
      `Dissanayake Super Inventory System`,
      ``,
      `---`,
      `This is an automated purchase order sent via Dissanayake Super Management System (Gmail Integration).`,
    ].join("\n"));
    setStep("email");
  }

  async function handleCreateReorder(e) {
    e?.preventDefault();
    if (!product || !selectedSupplier || isSubmitting) return;

    setIsSubmitting(true);
    setSending(true);

    const capturedEmailBody = emailBody;
    const orderRef = `PO-${Date.now()}`;

    // Build ReorderRequestDTO
    const dto = {
      orderRef,
      supplierEmail: selectedSupplier.email,
      items: [{
        productName: product.productName,
        productId:   product.productId ?? product.id ?? null,
        quantity:    orderQty,
        unitPrice:   product.sellingPrice ?? product.price ?? 0,
      }],
    };

    // Optimistic row — visible immediately while the request is in-flight
    const optimisticOrder = {
      id:            orderRef,
      productName:   product.productName,
      supplierName:  selectedSupplier.companyName,
      supplierEmail: selectedSupplier.email,
      quantity:      orderQty,
      orderDate:     new Date().toISOString().slice(0, 10),
      status:        "Pending",
    };
    setReorders((prev) => [optimisticOrder, ...prev]);

    try {
      const savedDTO   = await createOrder(dto);
      const savedOrder = mapHistoryItem(savedDTO, suppliers);

      // Swap optimistic entry for the real persisted record
      setReorders((prev) =>
        prev.map((o) => (o.id === orderRef ? savedOrder : o))
      );

      setSupplierEmailModal({ order: savedOrder, emailBody: capturedEmailBody });
      setSent(true);
      showToast({
        type: "success",
        title: "Order Confirmed",
        message: `Purchase Order ${orderRef} saved — email sent to ${selectedSupplier.email}.`,
      });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to create purchase order.";
      showToast({ type: "error", title: "Order Failed", message: msg });
      // Roll back the optimistic row
      setReorders((prev) => prev.filter((o) => o.id !== orderRef));
    } finally {
      setSending(false);
      setIsSubmitting(false);
      setEmailBody("");
    }
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
  async function handleSupplierConfirm() {
    const order = supplierEmailModal?.order;
    const id = order?.id;
    const dbId = order?.dbId;
    setSupplierEmailModal(null);
    if (!id || !dbId) return;
    try {
      const dto = await updateOrderStatus(dbId, "CONFIRMED");
      const updated = mapHistoryItem(dto, suppliers);
      setReorders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      // Fallback: update local state so the UI isn't left stale
      setReorders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Confirmed" } : o))
      );
      console.error("Confirm status sync failed:", err);
    }
    // If triggered from the Send flow (sent=true), reset back to config
    // so the user can see the updated history table
    setSent(false);
    setStep("config");
    setProduct(null);
    showToast({ type: "success", title: "Order Confirmed", message: "Supplier confirmed. Status updated to Confirmed." });
  }

  // Triggers 2-second cancellation overlay, calls API, then marks order Cancelled
  async function handleCancelOrder(id) {
    if (rowLoading[id]) return;
    const order = reorders.find((o) => o.id === id);
    if (!order) return;
    setCancelConfirmId(null);          // close the inline confirm row
    setCancelOverlay({ orderId: id });
    try {
      const dto = await updateOrderStatus(order.dbId, "CANCELLED");
      const updated = mapHistoryItem(dto, suppliers);
      setReorders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      setCancelOverlay(null);
      showToast({ type: "warning", title: "Order Cancelled", message: "Cancellation saved. Notice sent to supplier." });
    } catch (err) {
      setCancelOverlay(null);
      showToast({
        type: "error",
        title: "Cancel Failed",
        message: err.response?.data?.message ?? "Failed to cancel order. Please try again.",
      });
    }
  }

  async function handleUpdateOrder({ id, dbId, qty, email, message, items }) {
    setEditOrderModal(null);
    setUpdateOverlay(true);
    try {
      // Map existing items with the new quantity applied (update first item;
      // orders typically have one item per PO from the low-stock flow).
      const updatedItems = (items ?? []).map((item, i) => ({
        productName: item.productName,
        productId:   item.productId ?? null,
        quantity:    i === 0 ? qty : Number(item.quantity),
        unitPrice:   item.unitPrice,
      }));

      const dto = await updateOrder(dbId, {
        supplierEmail: email || null,
        items: updatedItems.length > 0 ? updatedItems : null,
      });
      const updatedOrder = mapHistoryItem(dto, suppliers);
      setReorders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
      showToast({ type: "info", title: "Order Updated", message: "Purchase Order updated successfully." });
    } catch (err) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.response?.data?.message ?? "Failed to update order.",
      });
    } finally {
      setUpdateOverlay(false);
    }
  }

  function handleMarkAsReceived(id) {
    if (rowLoading[id]) return;
    setReorders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Received" } : o))
    );
    showToast({ type: "success", title: "Stock Updated", message: "Stock level updated successfully." });
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
    <div className="flex h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-none py-8 space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
                  <Package size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Reorder Management
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Track and manage all purchase orders placed through the system.
                  </p>
                </div>
          </div>

          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8">
            <SummaryCard
              label="TOTAL ORDERS"
              value={reorders.length}
              icon={ClipboardList}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <SummaryCard
              label="PENDING"
              value={reorders.filter((o) => o.status === "Pending").length}
              icon={Package}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <SummaryCard
              label="CONFIRMED"
              value={reorders.filter((o) => o.status === "Confirmed").length}
              icon={Building2}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <SummaryCard
              label="RECEIVED"
              value={reorders.filter((o) => o.status === "Received").length}
              icon={CheckCircle}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          <div className="px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              {/* Section header */}
              <div className="flex flex-col gap-4 p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Purchase Order History</h2>
                    <p className="text-sm text-slate-500 mt-1">All orders placed through this system</p>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1 font-semibold text-slate-700">
                    {filteredReorders.length}{filteredReorders.length !== reorders.length && <span className="text-slate-400 font-normal ml-1">/ {reorders.length}</span>} orders
                  </span>
                </div>

                {/* Search + filter controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search by supplier */}
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by supplier name…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                    />
                  </div>

                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-48 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {["All", "Pending", "Confirmed", "Cancelled", "Received"].map((s) => (
                      <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto min-h-[400px]">
                {historyLoading ? (
                  <div className="p-6">
                    <SkeletonTable
                      rows={5}
                      columns={[
                        { width: "w-28" },
                        { width: "w-44", flexible: true },
                        { width: "w-36" },
                        { width: "w-16" },
                        { width: "w-24" },
                        { width: "w-20" },
                        { width: "w-32" },
                      ]}
                    />
                  </div>
                ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      {["Order ID", "Product", "Supplier", "Qty", "Order Date", "Status", ""].map((h, i) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${i === 6 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReorders.map((order) => (
                      <tr
                        key={order.id}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-6 border-b border-slate-50 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {order.id}
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50">
                          <span className="font-semibold text-slate-900">{order.productName}</span>
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50 text-slate-600 whitespace-nowrap">
                          {order.supplierName}
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50 tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50 tabular-nums text-slate-500 whitespace-nowrap">
                          {new Date(order.orderDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50 whitespace-nowrap">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-6 border-b border-slate-50 whitespace-nowrap text-right">
                          {cancelConfirmId === order.id ? (
                            /* ── Inline cancel confirmation ── */
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-medium text-slate-600">Cancel?</span>
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setCancelConfirmId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* View */}
                              <button
                                onClick={() => setSupplierEmailModal({ order, viewOnly: true })}
                                title="View order email"
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {/* Download PDF */}
                              <button
                                onClick={() => generatePurchaseOrderPDF(order, managerName)}
                                title="Download Purchase Order PDF"
                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <FileDown className="h-4 w-4" />
                              </button>
                              {/* Edit — Pending only */}
                              {order.status === "Pending" && (
                                <button
                                  onClick={() => setEditOrderModal(order)}
                                  title="Edit Order"
                                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {/* Cancel — Pending only */}
                              {order.status === "Pending" && (
                                <button
                                  onClick={() => setCancelConfirmId(order.id)}
                                  title="Cancel Order"
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}

                {/* Empty state */}
                {!historyLoading && filteredReorders.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {reorders.length === 0 ? "No Purchase Orders" : "No Matches Found"}
                      </p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        {reorders.length === 0
                          ? "Purchase orders will appear here once you start resolving low stock items."
                          : "Try adjusting your search or filters to see more results."}
                      </p>
                    </div>
                    {reorders.length > 0 && (
                      <button
                        onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                        className="mt-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>



      {/* Supplier Email Simulation Modal */}
      <SupplierEmailModal
        order={supplierEmailModal?.order ?? null}
        emailBody={supplierEmailModal?.emailBody ?? ""}
        viewOnly={supplierEmailModal?.viewOnly ?? false}
        onConfirm={handleSupplierConfirm}
        onClose={() => setSupplierEmailModal(null)}
      />

      {/* Cancellation Overlay */}
      {cancelOverlay && <CancelOverlay />}

      {/* Update Overlay */}
      {updateOverlay && <UpdateOverlay />}

      {/* Edit Order Modal */}
      {editOrderModal && (
        <EditOrderModal
          order={editOrderModal}
          onUpdate={handleUpdateOrder}
          onClose={() => setEditOrderModal(null)}
        />
      )}
    </div>
  );
}
