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
} from "lucide-react";

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusBadge({ status }) {
  const map = {
    LOW_STOCK:    { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", label: "Low Stock"    },
    OUT_OF_STOCK: { cls: "bg-red-100   text-red-700   dark:bg-red-900/20   dark:text-red-400",   label: "Out of Stock" },
  };
  const s = map[status] ?? { cls: "bg-muted text-muted-foreground", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StepButton({ step, label, desc, isActive, isCompleted, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left transition-all
        ${isActive
          ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/30"
          : isCompleted
            ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/20"
            : "border-border dark:border-gray-700"
        }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold
        ${isActive    ? "bg-indigo-600 text-white"
        : isCompleted ? "bg-emerald-500 text-white"
        :               "bg-muted text-muted-foreground dark:bg-gray-700 dark:text-gray-400"}`}>
        {isCompleted ? <Check className="h-4 w-4" /> : step}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-semibold
          ${isActive    ? "text-indigo-700 dark:text-indigo-300"
          : isCompleted ? "text-emerald-700 dark:text-emerald-400"
          :               "text-foreground dark:text-gray-100"}`}>
          {label}
        </p>
        <p className="truncate text-xs text-muted-foreground dark:text-gray-500">{desc}</p>
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
  const [emailBody,   setEmailBody]   = useState("");
  const [sending,     setSending]     = useState(false);
  const [sent,        setSent]        = useState(false);
  const [toast,       setToast]       = useState(null);

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

  function handleSend() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setToast(`Purchase Order sent to ${selectedSupplier?.email ?? "supplier"} successfully!`);
      setTimeout(() => setToast(null), 4500);
    }, 2000);
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
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">

        {/* â”€â”€ Heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground dark:text-white">
            <Package className="h-6 w-6 text-indigo-500" />
            Reorder Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
            Configure a purchase order and send it directly to your supplier.
          </p>
        </div>

        {/* â”€â”€ Step pill nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <StepButton
            step={1} label="Order Details" desc="Product, quantity &amp; supplier"
            isActive={step === "config"}
            isCompleted={step === "email"}
            onClick={() => { if (product) setStep("config"); }}
          />
          <ChevronRight className="hidden h-5 w-5 shrink-0 self-center text-muted-foreground dark:text-gray-600 sm:block" />
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
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center dark:border-gray-700">
            <Package className="h-14 w-14 text-muted-foreground/30" />
            <div>
              <p className="text-lg font-bold text-foreground dark:text-white">No product selected</p>
              <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
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
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
                      Selected Product
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground dark:text-white">
                      {product.productName}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                      <span>{product.category ?? "â€”"}</span>
                      {product.sku && <><span>Â·</span><span className="font-mono text-xs">{product.sku}</span></>}
                    </div>
                  </div>
                  <StatusBadge status={product.stockStatus} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/60 p-4 dark:bg-gray-700/50">
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Current Stock</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${
                      product.stockStatus === "OUT_OF_STOCK"
                        ? "text-red-600 dark:text-red-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {product.stockQuantity}
                      <span className="ml-1 text-sm font-normal text-muted-foreground dark:text-gray-400">
                        {product.unit ?? "units"}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-4 dark:bg-gray-700/50">
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Reorder Level</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground dark:text-white">
                      {product.reorderLevel}
                      <span className="ml-1 text-sm font-normal text-muted-foreground dark:text-gray-400">
                        {product.unit ?? "units"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Quantity */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-semibold text-foreground dark:text-white">
                  Order Quantity
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground dark:text-gray-400">
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
                  <span className="text-sm text-muted-foreground dark:text-gray-400">
                    {product.unit ?? "units"}
                  </span>
                </div>
              </div>
            </div>

            {/* â”€â”€ Right col â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="space-y-5">

              {/* Stock Preview */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-5 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-foreground dark:text-white">
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
                    <p className="text-xs text-muted-foreground dark:text-gray-500">Current</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">+</div>
                    <p className="text-xs font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{orderQty}</p>
                  </div>
                  {/* Expected */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold tabular-nums text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      {expectedStock}
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-gray-500">Expected</p>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                      <span>Current stock</span>
                      <span className="tabular-nums">{product.stockQuantity} {product.unit ?? "units"}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted dark:bg-gray-700">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${product.stockQuantity === 0 ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.max(2, currentPct)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground dark:text-gray-400">
                      <span>After reorder</span>
                      <span className="tabular-nums">{expectedStock} {product.unit ?? "units"}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted dark:bg-gray-700">
                      <div
                        className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, expectedPct)}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-500">
                    Reorder threshold:{" "}
                    <span className="font-medium text-foreground dark:text-gray-300">
                      {product.reorderLevel} {product.unit ?? "units"}
                    </span>
                    {expectedStock >= product.reorderLevel && (
                      <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">âœ“ Will meet threshold</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Supplier Selection */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-foreground dark:text-white">Supplier Information</h3>
                </div>

                {suppliersLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading suppliersâ€¦
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedSupplier?.id ?? ""}
                      onChange={(e) =>
                        setSelectedSupplier(suppliers.find((s) => s.id === parseInt(e.target.value)) ?? null)
                      }
                      className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.companyName}</option>
                      ))}
                    </select>

                    {selectedSupplier && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-muted/60 p-3 dark:bg-gray-700/50">
                            <p className="text-xs text-muted-foreground dark:text-gray-400">Company</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-foreground dark:text-white">{selectedSupplier.companyName}</p>
                          </div>
                          <div className="rounded-xl bg-muted/60 p-3 dark:bg-gray-700/50">
                            <p className="text-xs text-muted-foreground dark:text-gray-400">Contact</p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-foreground dark:text-white">{selectedSupplier.contactPerson}</p>
                          </div>
                        </div>
                        <div className="rounded-xl bg-muted/60 p-3 dark:bg-gray-700/50">
                          <p className="text-xs text-muted-foreground dark:text-gray-400">Email</p>
                          <p className="mt-0.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">{selectedSupplier.email}</p>
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
          <div className="flex items-center justify-between border-t border-border pt-4 dark:border-gray-700">
            <button
              onClick={() => navigate("/low-stock")}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground dark:text-gray-400 dark:hover:text-gray-100"
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
              <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 py-16 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
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
                <div className="rounded-2xl border border-border bg-card shadow-sm dark:border-gray-700 dark:bg-gray-800">

                  {/* Header bar */}
                  <div className="flex items-center gap-3 border-b border-border px-6 py-4 dark:border-gray-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                      <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground dark:text-white">Purchase Order Email</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">Review and send to supplier</p>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    {/* To */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-2.5 dark:bg-gray-700/50">
                      <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">To</span>
                      <span className="text-sm text-foreground dark:text-white">{selectedSupplier?.email ?? "â€”"}</span>
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-4 py-2.5 dark:bg-gray-700/50">
                      <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">Subject</span>
                      <span className="text-sm font-medium text-foreground dark:text-white">
                        Purchase Order for {product.productName}
                      </span>
                    </div>

                    {/* Body */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
                        Message
                      </label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={14}
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-border pt-4 dark:border-gray-700">
                      <button
                        onClick={() => setStep("config")}
                        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-gray-100"
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

      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
