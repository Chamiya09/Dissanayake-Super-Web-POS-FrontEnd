import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";

import type {
  ProductBulkImportResponse,
  ProductImportError,
  ProductPayload,
} from "@/api/productApi";
import { cn } from "@/lib/utils";

type ImportProductsCsvModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: ProductPayload[]) => Promise<ProductBulkImportResponse>;
};

type CsvParseResult = {
  products: ProductPayload[];
  errors: ProductImportError[];
};

const REQUIRED_HEADERS = {
  sku: ["productid", "sku", "barcode", "productcode"],
  productName: ["productname", "name", "itemname"],
  category: ["category", "productcategory"],
  buyingPrice: ["buyingprice", "costprice", "cost"],
  sellingPrice: ["sellingprice", "unitprice", "price", "retailprice"],
};

const OPTIONAL_HEADERS = {
  unit: ["pricingunit", "unit", "pricing"],
  stockQuantity: ["stockquantity", "stock", "quantity", "qty"],
  reorderLevel: ["reorderlevel", "reorder", "reorderpoint", "minimumstock"],
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

function parseProductsFromCsv(text: string): CsvParseResult {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return {
      products: [],
      errors: [{ rowNumber: 1, sku: null, message: "CSV file is empty." }],
    };
  }

  const headerRow = rows[0];
  const normalizedHeaders = headerRow.map(normalizeHeader);

  const skuIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.sku);
  const productNameIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.productName);
  const categoryIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.category);
  const buyingPriceIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.buyingPrice);
  const sellingPriceIndex = getHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.sellingPrice);

  const unitIndex = getHeaderIndex(normalizedHeaders, OPTIONAL_HEADERS.unit);
  const stockQtyIndex = getHeaderIndex(normalizedHeaders, OPTIONAL_HEADERS.stockQuantity);
  const reorderLevelIndex = getHeaderIndex(normalizedHeaders, OPTIONAL_HEADERS.reorderLevel);

  const missingColumns: string[] = [];
  if (skuIndex === -1) missingColumns.push("ProductID / SKU");
  if (productNameIndex === -1) missingColumns.push("ProductName");
  if (categoryIndex === -1) missingColumns.push("Category");
  if (buyingPriceIndex === -1) missingColumns.push("BuyingPrice");
  if (sellingPriceIndex === -1) missingColumns.push("SellingPrice or UnitPrice");

  if (missingColumns.length > 0) {
    return {
      products: [],
      errors: [
        {
          rowNumber: 1,
          sku: null,
          message: `Missing required CSV columns: ${missingColumns.join(", ")}.`,
        },
      ],
    };
  }

  const products: ProductPayload[] = [];
  const errors: ProductImportError[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    const sku = (row[skuIndex] ?? "").trim();
    const productName = (row[productNameIndex] ?? "").trim();
    const category = (row[categoryIndex] ?? "").trim();
    const unit = unitIndex === -1 ? "" : (row[unitIndex] ?? "").trim();

    const buyingPriceRaw = (row[buyingPriceIndex] ?? "").trim();
    const sellingPriceRaw = (row[sellingPriceIndex] ?? "").trim();

    const stockQuantityRaw = stockQtyIndex === -1 ? "" : (row[stockQtyIndex] ?? "").trim();
    const reorderLevelRaw = reorderLevelIndex === -1 ? "" : (row[reorderLevelIndex] ?? "").trim();

    const buyingPrice = parseNumeric(buyingPriceRaw);
    const sellingPrice = parseNumeric(sellingPriceRaw);
    const stockQuantity = parseNumeric(stockQuantityRaw);
    const reorderLevel = parseNumeric(reorderLevelRaw);

    const rowErrors: string[] = [];

    if (!sku) rowErrors.push("ProductID / SKU is required.");
    if (!productName) rowErrors.push("ProductName is required.");
    if (!category) rowErrors.push("Category is required.");

    if (buyingPrice === null) rowErrors.push("BuyingPrice must be a valid number.");
    if (sellingPrice === null) rowErrors.push("SellingPrice must be a valid number.");

    if (buyingPrice !== null && buyingPrice < 0) rowErrors.push("BuyingPrice must be 0 or greater.");
    if (sellingPrice !== null && sellingPrice < 0) rowErrors.push("SellingPrice must be 0 or greater.");

    if (stockQuantityRaw && stockQuantity === null) {
      rowErrors.push("StockQuantity must be a valid number.");
    }
    if (reorderLevelRaw && reorderLevel === null) {
      rowErrors.push("ReorderLevel must be a valid number.");
    }

    if (stockQuantity !== null && stockQuantity < 0) {
      rowErrors.push("StockQuantity must be 0 or greater.");
    }
    if (reorderLevel !== null && reorderLevel < 0) {
      rowErrors.push("ReorderLevel must be 0 or greater.");
    }

    if (rowErrors.length > 0) {
      errors.push({ rowNumber, sku: sku || null, message: rowErrors.join(" ") });
      continue;
    }

    products.push({
      sku,
      productName,
      category,
      unit: unit || undefined,
      buyingPrice: buyingPrice as number,
      sellingPrice: sellingPrice as number,
      stockQuantity: stockQuantity ?? undefined,
      reorderLevel: reorderLevel ?? undefined,
    });
  }

  return { products, errors };
}

function getErrorMessage(error: unknown): string {
  const message = (error as any)?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  return "CSV import failed. Please check your file and try again.";
}

export function ImportProductsCsvModal({ isOpen, onClose, onImport }: ImportProductsCsvModalProps) {
  const [fileName, setFileName] = useState("");
  const [parsedProducts, setParsedProducts] = useState<ProductPayload[]>([]);
  const [parseErrors, setParseErrors] = useState<ProductImportError[]>([]);
  const [importResult, setImportResult] = useState<ProductBulkImportResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName("");
    setParsedProducts([]);
    setParseErrors([]);
    setImportResult(null);
    setFormError(null);
    setImporting(false);
  }, [isOpen]);

  const backendErrors = importResult?.errors ?? [];
  const previewRows = useMemo(() => parsedProducts.slice(0, 5), [parsedProducts]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportResult(null);
    setFormError(null);

    try {
      const text = await file.text();
      const parsed = parseProductsFromCsv(text);
      setFileName(file.name);
      setParsedProducts(parsed.products);
      setParseErrors(parsed.errors);

      if (parsed.products.length === 0 && parsed.errors.length === 0) {
        setFormError("No data rows found in CSV file.");
      }
    } catch {
      setFileName(file.name);
      setParsedProducts([]);
      setParseErrors([]);
      setFormError("Could not read CSV file.");
    }
  };

  const handleImport = async () => {
    if (parsedProducts.length === 0) {
      setFormError("No valid products to import.");
      return;
    }

    setImporting(true);
    setFormError(null);

    try {
      const result = await onImport(parsedProducts);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0 border border-blue-100">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">Import Products from CSV</h2>
              <p className="text-[12px] text-slate-500 mt-1">
                Upload a CSV file and save products to database through backend.
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
              ProductID, ProductName, Category, PricingUnit, BuyingPrice, SellingPrice
            </p>
            <p className="text-[11px] text-slate-500">
              Optional: StockQuantity, ReorderLevel. UnitPrice is also accepted as SellingPrice.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="products-csv-input" className="text-[13px] font-medium text-slate-700">
              CSV File
            </label>
            <input
              id="products-csv-input"
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

          {(parsedProducts.length > 0 || parseErrors.length > 0 || importResult) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                  Valid rows: {parsedProducts.length}
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
                  <p className="text-[12px] font-medium text-slate-700">Preview (first 5 valid rows)</p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-[12px]">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">SKU</th>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Category</th>
                          <th className="px-3 py-2 text-right font-semibold">Buying</th>
                          <th className="px-3 py-2 text-right font-semibold">Selling</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((p, index) => (
                          <tr key={`${p.sku}-${index}`} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono">{p.sku}</td>
                            <td className="px-3 py-2">{p.productName}</td>
                            <td className="px-3 py-2">{p.category}</td>
                            <td className="px-3 py-2 text-right">{p.buyingPrice}</td>
                            <td className="px-3 py-2 text-right">{p.sellingPrice}</td>
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
                Successfully imported {importResult.importedCount} product
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
            disabled={importing || parsedProducts.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
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
