import type { CSSProperties } from "react";
import {
  Pencil,
  Trash2,
  X,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { List, type RowComponentProps } from "react-window";
import type { Product } from "@/data/product-management";
import { formatCurrency } from "@/utils/formatCurrency";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  searchInput: string;
  isSearching: boolean;
  onSearchInputChange: (value: string) => void;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange: (nextSize: number) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

type RowData = {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const DESKTOP_ROW_HEIGHT = 76;
const DESKTOP_LIST_HEIGHT = 560;

function ProductRow({ index, style, products, onView, onEdit, onDelete }: RowComponentProps<RowData>) {
  const product = products[index];
  if (!product) return null;

  return (
    <div
      style={style as CSSProperties}
      className={cn(
        "grid items-center border-b border-slate-100 px-6",
        "grid-cols-[1.2fr_2fr_1.2fr_1fr_1fr_1fr_0.9fr]"
      )}
    >
      <div className="pr-4">
        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-700 whitespace-nowrap">
          {product.sku || "No Barcode"}
        </span>
      </div>

      <div className="pr-4">
        <p className="truncate text-sm font-semibold text-slate-900">{product.productName}</p>
      </div>

      <div className="pr-4">
        <span className="truncate text-sm text-slate-700">{product.category}</span>
      </div>

      <div className="pr-4">
        <span className="truncate text-sm text-slate-700">{product.unit ?? "-"}</span>
      </div>

      <div className="pr-4 text-right tabular-nums text-sm text-slate-700">
        {formatCurrency(product.buyingPrice)}
      </div>

      <div className="pr-4 text-right tabular-nums text-sm font-semibold text-slate-900">
        {formatCurrency(product.sellingPrice)}
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          title="View product"
          onClick={() => onView(product)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
        >
          <Eye size={16} />
        </button>
        <button
          type="button"
          title="Edit product"
          onClick={() => onEdit(product)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          title="Delete product"
          onClick={() => onDelete(product)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export function ProductTable({
  products,
  totalElements,
  totalPages,
  page,
  pageSize,
  searchInput,
  isSearching,
  onSearchInputChange,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const rowData: RowData = {
    products,
    onView,
    onEdit,
    onDelete,
  };

  const hasData = products.length > 0;
  const pageLabel = totalPages === 0 ? 0 : page + 1;

  return (
    <div className="mb-4 flex w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-6 py-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchInputChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}

          <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-slate-300">
            <span className="inline-flex h-full items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
              PI
            </span>
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const normalized = raw.toUpperCase().startsWith("PI") ? raw.slice(2) : raw;
                onSearchInputChange(normalized);
              }}
              placeholder="00001"
              className="h-full border-0 rounded-none bg-transparent text-sm placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <span>{isSearching ? "Searching..." : `${totalElements} products`}</span>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1.2fr_2fr_1.2fr_1fr_1fr_1fr_0.9fr] border-b border-slate-100 bg-slate-50 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <span>Barcode</span>
          <span>Product Name</span>
          <span>Category</span>
          <span>Unit</span>
          <span className="text-right">Buying Price</span>
          <span className="text-right">Selling Price</span>
          <span className="text-right">Actions</span>
        </div>

        {hasData ? (
          <List
            rowCount={products.length}
            rowHeight={DESKTOP_ROW_HEIGHT}
            rowComponent={ProductRow}
            rowProps={rowData}
            style={{ height: DESKTOP_LIST_HEIGHT }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Package className="mb-3 h-10 w-10 opacity-40" strokeWidth={1.2} />
            <p className="text-sm font-medium text-slate-500">No products matched your search</p>
          </div>
        )}
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {hasData ? (
          products.map((product) => (
            <div key={product.id} className="space-y-3 p-4">
              <div className="space-y-1">
                <p className="truncate text-sm font-semibold text-slate-900">{product.productName}</p>
                <p className="text-[12px] text-slate-500">{product.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px]">
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Barcode</p>
                  <span className="font-mono font-medium text-slate-900 text-[12px]">{product.sku || "No Barcode"}</span>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit</p>
                  <span className="font-mono font-medium text-slate-900 text-[12px]">{product.unit ?? "-"}</span>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Buying</p>
                  <p className="tabular-nums text-slate-700">{formatCurrency(product.buyingPrice)}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Selling</p>
                  <p className="tabular-nums font-semibold text-slate-900">{formatCurrency(product.sellingPrice)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onView(product)}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 transition-all duration-150 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 transition-all duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Package className="mb-3 h-10 w-10 opacity-40" strokeWidth={1.2} />
            <p className="text-sm font-medium text-slate-500">No products matched your search</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-900">{products.length}</span> on page{" "}
          <span className="font-semibold text-slate-900">{pageLabel}</span> of{" "}
          <span className="font-semibold text-slate-900">{Math.max(totalPages, 1)}</span>
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-xs text-slate-500">Rows</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700"
          >
            {[25, 50, 75, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= Math.max(totalPages, 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
