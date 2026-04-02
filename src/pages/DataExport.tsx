import { useMemo, useState } from "react";
import { AppHeader } from "@/components/Layout/AppHeader";
import { useToast } from "@/context/GlobalToastContext";
import api from "@/lib/axiosInstance";
import { Database, Download, FileSpreadsheet, Loader2 } from "lucide-react";

type ExportKey = "sales" | "products" | "inventory" | "suppliers" | "users" | "reorder";

type ExportConfig = {
  key: ExportKey;
  title: string;
  description: string;
  endpoint: string;
  filenamePrefix: string;
};

const EXPORTS: ExportConfig[] = [
  {
    key: "sales",
    title: "Sales Data",
    description: "All sales records, statuses, and totals.",
    endpoint: "/api/sales",
    filenamePrefix: "sales-data",
  },
  {
    key: "products",
    title: "Products Data",
    description: "Product catalog with pricing and metadata.",
    endpoint: "/api/products",
    filenamePrefix: "products-data",
  },
  {
    key: "inventory",
    title: "Inventory Data",
    description: "Live stock status and inventory levels.",
    endpoint: "/api/inventory/status",
    filenamePrefix: "inventory-data",
  },
  {
    key: "suppliers",
    title: "Suppliers Data",
    description: "Supplier profile and assignment details.",
    endpoint: "/api/suppliers",
    filenamePrefix: "suppliers-data",
  },
  {
    key: "users",
    title: "Users Data",
    description: "User accounts, roles, and active status.",
    endpoint: "/api/users",
    filenamePrefix: "users-data",
  },
  {
    key: "reorder",
    title: "Reorder History",
    description: "Purchase order history and reorder events.",
    endpoint: "/api/v1/reorder/history",
    filenamePrefix: "reorder-history",
  },
];

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

function toCsv(rows: Array<Record<string, string>>): string {
  if (!rows.length) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((h) => set.add(h));
      return set;
    }, new Set<string>())
  );

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

      rows.push({
        saleId,
        receiptNo,
        saleDate,
        paymentMethod,
        status,
        cashier,
        saleTotal: saleTotal.toFixed(2),
        itemNo: String(index + 1),
        itemName: String(item.productName ?? item.name ?? ""),
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

  const runExport = async (cfg: ExportConfig) => {
    setLoading((prev) => ({ ...prev, [cfg.key]: true }));
    try {
      const { data } = await api.get(cfg.endpoint);
      const records = normalizeArrayPayload(data);
      const flattened =
        cfg.key === "sales"
          ? buildSalesItemRows(records)
          : records.map((r) => flattenRecord(r));
      const csv = toCsv(flattened);

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
                onClick={exportAll}
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
                  onClick={() => runExport(cfg)}
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
    </div>
  );
}
