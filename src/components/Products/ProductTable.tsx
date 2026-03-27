import { useState } from "react";
import {
  Pencil, Trash2, Search, ChevronDown, X,
  Package, Apple, Milk, Coffee,
  Wheat, Cookie, Beef, Leaf, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/product-management";
import { formatCurrency } from "@/utils/formatCurrency";

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
  Fruits:     "bg-rose-50    text-rose-600",
  Dairy:      "bg-blue-50    text-blue-600",
  Beverages:  "bg-sky-50     text-sky-600",
  Bakery:     "bg-amber-50   text-amber-600",
  Snacks:     "bg-lime-50    text-lime-600",
  Meat:       "bg-red-50     text-red-600",
  Vegetables: "bg-green-50   text-green-600",
};

/* ── Profit-margin badge (mirrors LeadTimeBadge palette logic) ── */
function ProfitBadge({ buying, selling }: { buying: number; selling: number }) {
  const margin = buying > 0 ? ((selling - buying) / buying) * 100 : 0;
  const high   = margin >= 40;
  const mid    = margin >= 20 && margin < 40;

  const colour = high
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
    : mid
    ? "bg-amber-500/10  text-amber-700  border-amber-200"
    : "bg-red-500/10    text-red-700    border-red-200";

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
  const colour = categoryBg[category]   ?? "bg-muted text-muted-foreground";

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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 text-[13px] font-bold select-none">
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
  "All",
  "Fruits",
  "Vegetables",
  "Rice & Grains",
  "Dhal & Pulses",
  "Flour & Baking",
  "Cooking Oil",
  "Spices & Condiments",
  "Dairy Products",
  "Eggs & Meat",
  "Instant Food",
  "Snacks",
  "Beverages",
  "Tea & Coffee",
  "Frozen Foods",
  "Canned Foods",
  "Baby Products",
  "Personal Care",
  "Cleaning Products",
  "Household Items",
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

  const fmt = (n: number) => formatCurrency(n);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col mb-4">

      {/* ── Search & Filter toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-4 px-6 py-4 border-b border-slate-200">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <input
            type="text"
            placeholder="Search by name, SKU or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl shadow-sm pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative sm:w-64">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-200 rounded-xl shadow-sm pl-4 pr-10 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 cursor-pointer transition-all"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear filters — only when active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterCategory("All"); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
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
                  className={`px-6 py-4 font-semibold text-slate-600 ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  No products matched your search.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
              <tr
                key={product.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
              >
                {/* Product name + ID */}
                <td className="px-6 py-6 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <ProductAvatar name={product.productName} />
                    <div>
                      <p className="font-semibold text-slate-900 whitespace-nowrap">
                        {product.productName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">#{product.id}</p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-6 py-6 border-b border-slate-100/50">
                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-700 whitespace-nowrap">
                    {product.sku}
                  </span>
                </td>

                {/* Category */}
                <td className="px-6 py-6 border-b border-slate-100/50 whitespace-nowrap">
                  <CategoryChip category={product.category} />
                </td>

                {/* Unit */}
                <td className="px-6 py-6 border-b border-slate-100/50 whitespace-nowrap">
                  {product.unit ? (
                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-mono font-medium text-slate-600">
                      {product.unit}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>

                {/* Buying price */}
                <td className="px-6 py-6 text-right tabular-nums text-slate-700 font-medium border-b border-slate-100/50 whitespace-nowrap">
                  {fmt(product.buyingPrice)}
                </td>

                {/* Selling price */}
                <td className="px-6 py-6 text-right tabular-nums text-slate-900 font-semibold border-b border-slate-100/50 whitespace-nowrap">
                  {fmt(product.sellingPrice)}
                </td>

                {/* Margin */}
                <td className="px-6 py-6 border-b border-slate-100/50 whitespace-nowrap">
                  <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
                </td>

                {/* Actions */}
                <td className="px-6 py-6 border-b border-slate-100/50">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Edit product"
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      title="Delete product"
                      onClick={() => onDelete(product)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((product) => (
          <div key={product.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ProductAvatar name={product.productName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{product.productName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">#{product.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <CategoryChip category={product.category} />
                <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[13px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">SKU</p>
                <span className="font-mono font-medium text-slate-900 text-[12px]">{product.sku}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Unit</p>
                <span className="font-mono font-medium text-slate-900 text-[12px]">{product.unit ?? "—"}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Buying</p>
                <p className="font-medium text-slate-700 tabular-nums">{fmt(product.buyingPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Selling</p>
                <p className="font-semibold text-slate-900 tabular-nums">{fmt(product.sellingPrice)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[13px] font-medium text-slate-700 bg-white border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-150"
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
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Package className="h-10 w-10 mb-3 opacity-40" strokeWidth={1.2} />
          {hasActiveFilters ? (
            <>
              <p className="text-sm font-medium text-slate-500">No products match your filters</p>
              <p className="text-xs mt-1 text-slate-400">Try adjusting your search term or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500">No products found</p>
              <p className="text-xs mt-1 text-slate-400">Add your first product to get started.</p>
            </>
          )}
        </div>
      )}

      {/* ── Footer count ── */}
      {filtered.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-900">{filtered.length}</span>
            {" "}of{" "}
            <span className="font-semibold text-slate-900">{products.length}</span>
            {" "}products
          </p>
          {hasActiveFilters && (
            <span className="text-[11px] text-slate-400">
              {products.length - filtered.length} hidden by filters
            </span>
          )}
        </div>
      )}
    </div>
  );
}
