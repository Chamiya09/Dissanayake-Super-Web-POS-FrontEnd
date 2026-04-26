import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";

import type {
  InventoryBulkImportResponse,
  InventoryImportError,
  InventoryImportPayload,
} from "@/api/inventoryApi";
import { cn } from "@/lib/utils";

type ImportInventoryCsvModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: InventoryImportPayload[]) => Promise<InventoryBulkImportResponse>;
};

type CsvParseResult = {
  rows: InventoryImportPayload[];
  errors: InventoryImportError[];
};

const REQUIRED_HEADERS = {
  sku: ["productid", "sku", "barcode", "productcode"],
  stockQuantity: ["inventorystock", "stockquantity", "stock", "quantity", "qty", "currentstock"],
  reorderLevel: ["reorderlevel", "reorder", "reorderpoint", "minimumstock"],
};

const OPTIONAL_HEADERS = {
  unit: ["pricingunit", "unit", "stockunit"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getHeaderIndex(normalizedHeaders: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function parseNumeric(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInventoryFromCsv(text: string): CsvParseResult {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return {
      rows: [],
      errors: [{ rowNumber: 1, sku: null, message: "CSV file is empty." }],
    };
  }

  const headerRow = rows[0];
  const normalizedHeaders = headerRow.map(normalizeHeader);

  const skuIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.sku);
  const stockQuantityIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.stockQuantity);
  const reorderLevelIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.reorderLevel);
  const unitIndex = getHeaderIndex(normalizedHeaders, OPTIONAL_HEADERS.unit);

  const missingColumns: string[] = [];
  if (skuIndex === -1) missingColumns.push("ProductID / SKU");
  if (stockQuantityIndex === -1) missingColumns.push("InventoryStock");
  if (reorderLevelIndex === -1) missingColumns.push("ReorderLevel");

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          sku: null,
          message: `Missing required CSV columns: ${missingColumns.join(", ")}.`,
        },
      ],
    };
  }

  const payloadRows: InventoryImportPayload[] = [];
  const errors: InventoryImportError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    const sku = (row[skuIndex] ?? "").trim();
    const stockQuantityRaw = (row[stockQuantityIndex] ?? "").trim();
    const reorderLevelRaw = (row[reorderLevelIndex] ?? "").trim();
    const unit = unitIndex === -1 ? "" : (row[unitIndex] ?? "").trim();

    const stockQuantity = parseNumeric(stockQuantityRaw);
    const reorderLevel = parseNumeric(reorderLevelRaw);

    const rowErrors: string[] = [];

    if (!sku) rowErrors.push("ProductID / SKU is required.");

    if (stockQuantity === null) rowErrors.push("InventoryStock must be a valid number.");
    if (reorderLevel === null) rowErrors.push("ReorderLevel must be a valid number.");

    if (stockQuantity !== null && stockQuantity < 0) {
      rowErrors.push("InventoryStock must be 0 or greater.");
    }
    if (reorderLevel !== null && reorderLevel < 0) {
      rowErrors.push("ReorderLevel must be 0 or greater.");
    }
    if (unit.length > 20) {
      rowErrors.push("Unit must be 20 characters or fewer.");
    }

    if (rowErrors.length > 0) {
      errors.push({ rowNumber, sku: sku || null, message: rowErrors.join(" ") });
      continue;
    }

    payloadRows.push({
      sku,
      stockQuantity: stockQuantity as number,
      reorderLevel: reorderLevel as number,
      unit: unit || undefined,
    });
  }

  return { rows: payloadRows, errors };
}

function getErrorMessage(error: unknown): string {
  const message = (error as any)?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  return "Inventory CSV import failed. Please check your file and try again.";
}

export function ImportInventoryCsvModal({ isOpen, onClose, onImport }: ImportInventoryCsvModalProps) {
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<InventoryImportPayload[]>([]);
  const [parseErrors, setParseErrors] = useState<InventoryImportError[]>([]);
  const [importResult, setImportResult] = useState<InventoryBulkImportResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName("");
    setParsedRows([]);
    setParseErrors([]);
    setImportResult(null);
    setFormError(null);
    setImporting(false);
  }, [isOpen]);

  const backendErrors = importResult?.errors ?? [];
  const previewRows = useMemo(() => parsedRows.slice(0, 6), [parsedRows]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    setFormError(null);

    try {
      const text = await file.text();
      const parsed = parseInventoryFromCsv(text);
      setFileName(file.name);
      setParsedRows(parsed.rows);
      setParseErrors(parsed.errors);

      if (parsed.rows.length === 0 && parsed.errors.length === 0) {
        setFormError("No data rows found in CSV file.");
      }
    } catch {
      setFileName(file.name);
      setParsedRows([]);
      setParseErrors([]);
      setFormError("Could not read CSV file.");
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) {
      setFormError("No valid rows to import.");
      return;
    }

    setImporting(true);
    setFormError(null);

    try {
      const result = await onImport(parsedRows);
      setImportResult(result);

      if (result.failedCount === 0 && parseErrors.length === 0) {
        onClose();
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0 border border-teal-100">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">Import Inventory from CSV</h2>
              <p className="text-[12px] text-slate-500 mt-1">
                Upload a CSV file to update stock and reorder levels by SKU.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-muted hover:text-accent-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <p className="text-[13px] font-semibold text-slate-800">Expected columns</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              ProductID, InventoryStock, ReorderLevel
            </p>
            <p className="text-[11px] text-slate-500">
              Optional: Unit. SKU is accepted instead of ProductID.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="inventory-csv-input" className="text-[13px] font-medium text-slate-700">
              CSV File
            </label>
            <input
              id="inventory-csv-input"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className={cn(
                "block w-full rounded-lg border border-input bg-white px-3 py-2 text-[13px]",
                "file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium"
              )}
            />
            {fileName && <p className="text-[11px] text-slate-500">Selected file: {fileName}</p>}
          </div>

          {(parsedRows.length > 0 || parseErrors.length > 0 || importResult) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                  Valid rows: {parsedRows.length}
                </span>
                <span className="rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-700">
                  Parse errors: {parseErrors.length}
                </span>
                {importResult && (
                  <>
                    <span className="rounded-md bg-blue-50 px-2 py-1 font-medium text-blue-700">
                      Imported: {importResult.importedCount}
                    </span>
                    <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700">
                      Backend failed: {importResult.failedCount}
                    </span>
                  </>
                )}
              </div>

              {previewRows.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[12px] font-medium text-slate-700">Preview (first 6 valid rows)</p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">SKU</th>
                          <th className="px-3 py-2 text-right font-semibold">Stock</th>
                          <th className="px-3 py-2 text-right font-semibold">Reorder</th>
                          <th className="px-3 py-2 text-left font-semibold">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${row.sku}-${index}`} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono">{row.sku}</td>
                            <td className="px-3 py-2 text-right">{row.stockQuantity}</td>
                            <td className="px-3 py-2 text-right">{row.reorderLevel}</td>
                            <td className="px-3 py-2">{row.unit ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-rose-700 font-medium">{formError}</p>
            </div>
          )}

          {(parseErrors.length > 0 || backendErrors.length > 0) && (
            <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <p className="text-[12px] font-semibold text-amber-800">Failed rows</p>
              {[...parseErrors, ...backendErrors].slice(0, 25).map((error, index) => (
                <div key={`${error.rowNumber}-${error.sku ?? "no-sku"}-${index}`} className="text-[12px] text-amber-900">
                  Row {error.rowNumber}{error.sku ? ` (${error.sku})` : ""}: {error.message}
                </div>
              ))}
            </div>
          )}

          {importResult && importResult.importedCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-[12px] text-emerald-700 font-medium">
                Successfully imported {importResult.importedCount} inventory row
                {importResult.importedCount === 1 ? "" : "s"}.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleImport}
            disabled={importing || parsedRows.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Valid Rows
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
