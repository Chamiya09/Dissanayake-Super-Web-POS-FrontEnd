import { useState } from "react";
import {
  Pencil, Trash2, Search, ChevronDown, X,
  Package, Apple, Milk, Coffee,
  Wheat, Cookie, Beef, Leaf, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";

/* ── Category icon map ── */
const categoryIcon: Record<string, React.ElementType> = {
  Fruits:     Apple,
  Dairy:      Milk,
  Beverages:  Coffee,
  Bakery:     Wheat,
  Snacks:     Cookie,
  Meat:       Beef,
  Vegetables: Leaf,
};

/* ── Category pastel background ── */
const categoryBg: Record<string, string> = {
  Fruits:     "bg-rose-50    text-rose-600    dark:bg-rose-900/20   dark:text-rose-400",
  Dairy:      "bg-blue-50    text-blue-600    dark:bg-blue-900/20   dark:text-blue-400",
  Beverages:  "bg-sky-50     text-sky-600     dark:bg-sky-900/20    dark:text-sky-400",
  Bakery:     "bg-amber-50   text-amber-600   dark:bg-amber-900/20  dark:text-amber-400",
  Snacks:     "bg-lime-50    text-lime-600    dark:bg-lime-900/20   dark:text-lime-400",
  Meat:       "bg-red-50     text-red-600     dark:bg-red-900/20    dark:text-red-400",
  Vegetables: "bg-green-50   text-green-600   dark:bg-green-900/20  dark:text-green-400",
};

/* ── Profit-margin badge (mirrors LeadTimeBadge palette logic) ── */
function ProfitBadge({ buying, selling }: { buying: number; selling: number }) {
  const margin = buying > 0 ? ((selling - buying) / buying) * 100 : 0;
  const high   = margin >= 40;
  const mid    = margin >= 20 && margin < 40;

  const colour = high
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800"
    : mid
    ? "bg-amber-500/10  text-amber-700  border-amber-200  dark:text-amber-400  dark:border-amber-800"
    : "bg-red-500/10    text-red-700    border-red-200    dark:text-red-400    dark:border-red-800";

  const dot = high ? "bg-emerald-500" : mid ? "bg-amber-500" : "bg-red-500";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        colour
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
      {margin.toFixed(1)}%
    </span>
  );
}

/* ── Category chip ── */
function CategoryChip({ category }: { category: string }) {
  const Icon   = categoryIcon[category] ?? Tag;
  const colour = categoryBg[category]   ?? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        colour
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {category}
    </span>
  );
}

/* ── Product avatar (initials) ── */
function ProductAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 dark:bg-violet-400/20 text-violet-600 dark:text-violet-400 text-[13px] font-bold select-none">
      {initials}
    </div>
  );
}

/* ── Props ── */
interface ProductTableProps {
  products: Product[];
  onEdit:   (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const CATEGORIES = [
  "All", "Fruits", "Dairy", "Beverages", "Bakery", "Snacks", "Meat", "Vegetables",
] as const;

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [search,         setSearch]         = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  /* ── Client-side filtering ── */
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.productName.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      String(p.id).toLowerCase().includes(q);

    const matchesCategory =
      filterCategory === "All" || p.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = search !== "" || filterCategory !== "All";

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* ── Search & Filter toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-400 dark:text-slate-500 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
          <input
            type="text"
            placeholder="Search by name, SKU or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm pl-9 pr-8 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 focus:border-slate-400 dark:focus:border-slate-600 transition-all duration-200"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative sm:w-52">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm pl-4 pr-9 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-slate-50/10 focus:border-slate-400 dark:focus:border-slate-600 cursor-pointer transition-all duration-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
        </div>

        {/* Clear filters — only when active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterCategory("All"); }}
            className="self-center sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 whitespace-nowrap"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
              {[
                { label: "Product",       align: "text-left" },
                { label: "SKU",            align: "text-left" },
                { label: "Category",       align: "text-left" },
                { label: "Unit",           align: "text-left" },
                { label: "Buying Price",   align: "text-right" },
                { label: "Selling Price",  align: "text-right" },
                { label: "Margin",         align: "text-left" },
                { label: "Actions",        align: "text-right" },
              ].map(({ label, align }) => (
                <th
                  key={label}
                  className={cn(
                    "px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 whitespace-nowrap",
                    align
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((product, idx) => (
              <tr
                key={product.id}
                className={cn(
                  "border-b border-slate-100 dark:border-slate-800 last:border-0",
                  "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150",
                  idx % 2 !== 0 ? "bg-slate-50/30 dark:bg-slate-800/[0.15]" : ""
                )}
              >
                {/* Product name + ID */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <ProductAvatar name={product.productName} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                        {product.productName}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">#{product.id}</p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-6 py-4">
                  <span className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 px-2 py-0.5 text-[12px] font-mono font-medium text-slate-600 dark:text-slate-300">
                    {product.sku}
                  </span>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <CategoryChip category={product.category} />
                </td>

                {/* Unit */}
                <td className="px-6 py-4">
                  {product.unit ? (
                    <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/60 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                      {product.unit}
                    </span>
                  ) : (
                    <span className="text-[13px] text-slate-300 dark:text-slate-600">—</span>
                  )}
                </td>

                {/* Buying price */}
                <td className="px-6 py-4 text-right tabular-nums text-slate-600 dark:text-slate-300 font-medium">
                  {fmt(product.buyingPrice)}
                </td>

                {/* Selling price */}
                <td className="px-6 py-4 text-right tabular-nums text-slate-800 dark:text-slate-100 font-semibold">
                  {fmt(product.sellingPrice)}
                </td>

                {/* Margin */}
                <td className="px-6 py-4">
                  <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Edit product"
                      onClick={() => onEdit(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-all duration-150"
                    >
                      <Pencil className="h-[15px] w-[15px]" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      title="Delete product"
                      onClick={() => onDelete(product)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all duration-150"
                    >
                      <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.map((product) => (
          <div key={product.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ProductAvatar name={product.productName} />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50 leading-tight">{product.productName}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">#{product.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <CategoryChip category={product.category} />
                <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[13px] rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-3 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">SKU</p>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-200 text-[12px]">{product.sku}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Unit</p>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-200 text-[12px]">{product.unit ?? "—"}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Buying</p>
                <p className="font-medium text-slate-600 dark:text-slate-300 tabular-nums">{fmt(product.buyingPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Selling</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(product.sellingPrice)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:border-blue-900 transition-all duration-150"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:text-red-400 dark:hover:bg-red-950/40 dark:hover:border-red-900 transition-all duration-150"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
          <Package className="h-10 w-10 mb-3 opacity-40" strokeWidth={1.2} />
          {hasActiveFilters ? (
            <>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No products match your filters</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">Try adjusting your search term or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No products found</p>
              <p className="text-xs mt-1 text-slate-400 dark:text-slate-500">Add your first product to get started.</p>
            </>
          )}
        </div>
      )}

      {/* ── Footer count ── */}
      {filtered.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span>
            {" "}of{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">{products.length}</span>
            {" "}products
          </p>
          {hasActiveFilters && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {products.length - filtered.length} hidden by filters
            </span>
          )}
        </div>
      )}
    </div>
  );
}
