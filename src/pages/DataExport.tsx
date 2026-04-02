import { useMemo, useState } from "react";
import axios from "axios";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import api from "@/lib/axiosInstance";
import { Database, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExportKey = "sales" | "products" | "inventory" | "suppliers" | "users" | "reorder";

type ExportConfig = {
  key: ExportKey;
  title: string;
  description: string;
  endpoint: string;
  filenamePrefix: string;
};

type PendingExportAction =
  | { mode: "single"; config: ExportConfig }
  | { mode: "all" };

const AUTH_LS_KEY = "pos_auth_user";

const authVerifyClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

const EXPORTS: ExportConfig[] = [
  {
    key: "sales",
    title: "Sales Data",
    description: "All sales records, statuses, and totals.",
    endpoint: "/api/sales",
    filenamePrefix: "pos-sales-item-report",
  },
  {
    key: "products",
    title: "Products Data",
    description: "Product catalog with pricing and metadata.",
    endpoint: "/api/products",
    filenamePrefix: "pos-products-catalog",
  },
  {
    key: "inventory",
    title: "Inventory Data",
    description: "Live stock status and inventory levels.",
    endpoint: "/api/inventory/status",
    filenamePrefix: "pos-inventory-status",
  },
  {
    key: "suppliers",
    title: "Suppliers Data",
    description: "Supplier profile and assignment details.",
    endpoint: "/api/suppliers",
    filenamePrefix: "pos-suppliers-master",
  },
  {
    key: "users",
    title: "Users Data",
    description: "User accounts, roles, and active status.",
    endpoint: "/api/users",
    filenamePrefix: "pos-users-directory",
  },
  {
    key: "reorder",
    title: "Reorder History",
    description: "Purchase order history and reorder events.",
    endpoint: "/api/v1/reorder/history",
    filenamePrefix: "pos-reorder-history",
  },
];

const COLUMN_ORDER: Record<ExportKey, string[]> = {
  sales: [
    "saleId",
    "receiptNo",
    "saleDate",
    "paymentMethod",
    "status",
    "cashier",
    "saleTotal",
    "itemNo",
    "itemName",
    "itemSku",
    "itemQuantity",
    "itemUnitPrice",
    "itemLineTotal",
    "itemReturnedQuantity",
  ],
  products: [
    "id",
    "name",
    "productName",
    "sku",
    "barcode",
    "category",
    "brand",
    "unit",
    "buyingPrice",
    "costPrice",
    "sellingPrice",
    "price",
    "currentStock",
    "stock",
    "reorderLevel",
    "supplierId",
    "supplierName",
    "supplierEmail",
    "active",
    "status",
    "createdAt",
    "updatedAt",
  ],
  inventory: [
    "inventoryId",
    "productId",
    "productName",
    "sku",
    "category",
    "currentStock",
    "reorderLevel",
    "unit",
    "sellingPrice",
    "supplierName",
    "supplierEmail",
    "lastUpdated",
  ],
  suppliers: [
    "id",
    "companyName",
    "contactPerson",
    "email",
    "phone",
    "leadTimeDays",
    "notes",
    "active",
    "createdAt",
    "updatedAt",
  ],
  users: [
    "id",
    "username",
    "fullName",
    "email",
    "role",
    "active",
    "emailNotifications",
    "createdAt",
    "updatedAt",
  ],
  reorder: [
    "id",
    "orderRef",
    "status",
    "createdAt",
    "updatedAt",
    "supplierName",
    "supplierEmail",
    "totalAmount",
    "items",
  ],
};

function flattenRecord(input: unknown, parentKey = ""): Record<string, string> {
  if (input === null || input === undefined) {
    return parentKey ? { [parentKey]: "" } : {};
  }

  if (Array.isArray(input)) {
    return parentKey ? { [parentKey]: JSON.stringify(input) } : {};
  }

  if (typeof input !== "object") {
    return parentKey ? { [parentKey]: String(input) } : {};
  }

  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextKey = parentKey ? `${parentKey}.${key}` : key;

    if (value === null || value === undefined) {
      output[nextKey] = "";
      continue;
    }

    if (Array.isArray(value)) {
      output[nextKey] = JSON.stringify(value);
      continue;
    }

    if (typeof value === "object") {
      Object.assign(output, flattenRecord(value, nextKey));
      continue;
    }

    output[nextKey] = String(value);
  }

  return output;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildOrderedHeaders(rows: Array<Record<string, string>>, preferredOrder: string[]): string[] {
  const detected = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((h) => set.add(h));
      return set;
    }, new Set<string>())
  );

  const preferred = preferredOrder.filter((h) => detected.includes(h));
  const remaining = detected.filter((h) => !preferred.includes(h)).sort((a, b) => a.localeCompare(b));
  return [...preferred, ...remaining];
}

function toCsv(rows: Array<Record<string, string>>, preferredOrder: string[] = []): string {
  if (!rows.length) return "";

  const headers = buildOrderedHeaders(rows, preferredOrder);

  const headerRow = headers.map(escapeCsv).join(",");
  const bodyRows = rows.map((row) => headers.map((h) => escapeCsv(row[h] ?? "")).join(","));

  return [headerRow, ...bodyRows].join("\n");
}

function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function normalizeArrayPayload(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "items", "content", "results"]) {
      const candidate = obj[key];
      if (Array.isArray(candidate)) {
        return candidate as Array<Record<string, unknown>>;
      }
    }
    return [obj];
  }

  return [];
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toNonEmptyString(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text;
}

function resolveSaleItemName(item: Record<string, unknown>): string {
  const direct = [
    item.productName,
    item.name,
    item.itemName,
    item.product_name,
    item.product_title,
  ];

  for (const candidate of direct) {
    const value = toNonEmptyString(candidate);
    if (value) return value;
  }

  const nestedProduct = item.product as Record<string, unknown> | undefined;
  if (nestedProduct && typeof nestedProduct === "object") {
    const nested = [nestedProduct.productName, nestedProduct.name, nestedProduct.title];
    for (const candidate of nested) {
      const value = toNonEmptyString(candidate);
      if (value) return value;
    }
  }

  const fallbackSku = toNonEmptyString(item.sku ?? item.itemSku);
  if (fallbackSku) return `Item (${fallbackSku})`;

  return "Unnamed Item";
}

function buildSalesItemRows(records: Array<Record<string, unknown>>): Array<Record<string, string>> {
  const rows: Array<Record<string, string>> = [];

  for (const sale of records) {
    const saleId = String(sale.id ?? "");
    const receiptNo = String(sale.receiptNo ?? "");
    const saleDate = String(sale.saleDate ?? "");
    const paymentMethod = String(sale.paymentMethod ?? "");
    const status = String(sale.status ?? "");
    const saleTotal = toNumber(sale.totalAmount);
    const cashier = String(sale.cashierName ?? sale.createdBy ?? "");

    const items = Array.isArray(sale.items) ? (sale.items as Array<Record<string, unknown>>) : [];

    if (!items.length) {
      rows.push({
        saleId,
        receiptNo,
        saleDate,
        paymentMethod,
        status,
        cashier,
        saleTotal: saleTotal.toFixed(2),
        itemName: "",
        itemSku: "",
        itemQuantity: "",
        itemUnitPrice: "",
        itemLineTotal: "",
        itemReturnedQuantity: "",
      });
      continue;
    }

    items.forEach((item, index) => {
      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.unitPrice);
      const returnedQuantity = toNumber(item.returnedQuantity);
      const lineTotal = quantity * unitPrice;
      const itemName = resolveSaleItemName(item);

      rows.push({
        saleId,
        receiptNo,
        saleDate,
        paymentMethod,
        status,
        cashier,
        saleTotal: saleTotal.toFixed(2),
        itemNo: String(index + 1),
        itemName,
        itemSku: String(item.sku ?? ""),
        itemQuantity: String(quantity),
        itemUnitPrice: unitPrice.toFixed(2),
        itemLineTotal: lineTotal.toFixed(2),
        itemReturnedQuantity: returnedQuantity > 0 ? String(returnedQuantity) : "0",
      });
    });
  }

  return rows;
}

export default function DataExport() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<Record<ExportKey, boolean>>({
    sales: false,
    products: false,
    inventory: false,
    suppliers: false,
    users: false,
    reorder: false,
  });

  const anyLoading = useMemo(() => Object.values(loading).some(Boolean), [loading]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authChecking, setAuthChecking] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingExportAction | null>(null);

  const runExport = async (cfg: ExportConfig) => {
    setLoading((prev) => ({ ...prev, [cfg.key]: true }));
    try {
      const { data } = await api.get(cfg.endpoint);
      const records = normalizeArrayPayload(data);
      const flattened =
        cfg.key === "sales"
          ? buildSalesItemRows(records)
          : records.map((r) => flattenRecord(r));
      const csv = toCsv(flattened, COLUMN_ORDER[cfg.key]);

      if (!csv) {
        showToast({ type: "warning", title: "No Data", message: `No rows returned for ${cfg.title}.` });
        return;
      }

      const datePart = new Date().toISOString().slice(0, 10);
      downloadCsv(`${cfg.filenamePrefix}-${datePart}.csv`, csv);

      showToast({
        type: "success",
        title: "Export Complete",
        message: `${cfg.title} exported (${flattened.length} rows).`,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || `Failed to export ${cfg.title}.`;
      showToast({ type: "error", title: "Export Failed", message });
    } finally {
      setLoading((prev) => ({ ...prev, [cfg.key]: false }));
    }
  };

  const exportAll = async () => {
    for (const cfg of EXPORTS) {
      // Sequential export avoids overwhelming server and keeps UX predictable.
      // eslint-disable-next-line no-await-in-loop
      await runExport(cfg);
    }
  };

  const requestSingleExport = (cfg: ExportConfig) => {
    setPendingAction({ mode: "single", config: cfg });
    setAuthPassword("");
    setAuthError("");
    setAuthOpen(true);
  };

  const requestExportAll = () => {
    setPendingAction({ mode: "all" });
    setAuthPassword("");
    setAuthError("");
    setAuthOpen(true);
  };

  const verifyAndExport = async () => {
    if (!pendingAction) return;

    if (!authPassword.trim()) {
      setAuthError("Password is required.");
      return;
    }

    let username = "";
    try {
      const raw = localStorage.getItem(AUTH_LS_KEY);
      username = raw ? JSON.parse(raw)?.username ?? "" : "";
    } catch {
      username = "";
    }

    if (!username) {
      setAuthError("Session username not found. Please login again.");
      return;
    }

    setAuthChecking(true);
    setAuthError("");

    try {
      await authVerifyClient.post("/api/auth/login", {
        username,
        password: authPassword.trim(),
      });

      setAuthOpen(false);

      if (pendingAction.mode === "single") {
        await runExport(pendingAction.config);
      } else {
        await exportAll();
      }
    } catch (error: any) {
      const msg =
        error?.response?.status === 401
          ? "Password is wrong."
          : error?.response?.data?.message || "Credential verification failed.";
      setAuthError(msg);
    } finally {
      setAuthChecking(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Data Export Center</h1>
                  <p className="mt-1 text-sm text-slate-500">Export sales and operational data as CSV files for reporting and backup.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={requestExportAll}
                disabled={anyLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
              >
                {anyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {EXPORTS.map((cfg) => (
              <div key={cfg.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{cfg.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{cfg.description}</p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 text-xs text-slate-500">Source: {cfg.endpoint}</div>

                <button
                  type="button"
                  onClick={() => requestSingleExport(cfg)}
                  disabled={loading[cfg.key]}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loading[cfg.key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={authOpen} onOpenChange={(open) => !authChecking && setAuthOpen(open)}>
        <DialogContent className="rounded-2xl border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Export Access Required</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Enter your account password to continue exporting data files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
            <Input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={authChecking}
              className="h-11 rounded-xl border-slate-200"
            />
            {authError && <p className="text-xs font-medium text-red-600">{authError}</p>}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setAuthOpen(false)}
              disabled={authChecking}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyAndExport}
              disabled={authChecking}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
            >
              {authChecking && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify & Export
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
