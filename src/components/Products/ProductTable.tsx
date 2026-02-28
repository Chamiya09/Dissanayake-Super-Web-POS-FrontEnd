import { useState } from "react";
import {
  Pencil, Trash2, Search, SlidersHorizontal,
  Package, ShoppingBag, Apple, Milk, Coffee,
  Wheat, Cookie, Beef, Leaf, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary text-[13px] font-bold select-none">
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
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

      {/* ── Search & Filter toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-44 text-sm bg-background">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters — only visible when active */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-[12px] text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => { setSearch(""); setFilterCategory("All"); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Product
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                SKU / Barcode
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Unit
              </th>
              <th className="px-5 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Buying Price
              </th>
              <th className="px-5 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Selling Price
              </th>
              <th className="px-5 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Margin
              </th>
              <th className="px-5 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((product, idx) => (
              <tr
                key={product.id}
                className={cn(
                  "group transition-colors hover:bg-muted/30",
                  idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                )}
              >
                {/* Product name + ID */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <ProductAvatar name={product.productName} />
                    <div>
                      <p className="font-semibold text-foreground leading-tight">
                        {product.productName}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{product.id}</p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-5 py-4">
                  <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[12px] font-mono font-medium text-foreground">
                    {product.sku}
                  </span>
                </td>

                {/* Category */}
                <td className="px-5 py-4">
                  <CategoryChip category={product.category} />
                </td>

                {/* Unit */}
                <td className="px-5 py-4">
                  {product.unit ? (
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground">
                      {product.unit}
                    </span>
                  ) : (
                    <span className="text-[12px] text-muted-foreground/40">—</span>
                  )}
                </td>

                {/* Buying price */}
                <td className="px-5 py-4 text-right tabular-nums text-foreground font-medium">
                  {fmt(product.buyingPrice)}
                </td>

                {/* Selling price */}
                <td className="px-5 py-4 text-right tabular-nums text-foreground font-semibold">
                  {fmt(product.sellingPrice)}
                </td>

                {/* Margin */}
                <td className="px-5 py-4">
                  <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="h-8 gap-1.5 text-[12px] hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(product)}
                      className="h-8 gap-1.5 text-[12px] hover:bg-red-500/10 hover:text-red-600 hover:border-red-300 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden divide-y divide-border">
        {filtered.map((product) => (
          <div key={product.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ProductAvatar name={product.productName} />
                <div>
                  <p className="font-semibold text-foreground leading-tight">{product.productName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{product.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <CategoryChip category={product.category} />
                <ProfitBadge buying={product.buyingPrice} selling={product.sellingPrice} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[13px] rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  SKU
                </p>
                <span className="font-mono font-medium text-foreground text-[12px]">
                  {product.sku}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Unit
                </p>
                <span className="font-mono font-medium text-foreground text-[12px]">
                  {product.unit ?? "—"}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Buying
                </p>
                <p className="font-medium text-foreground tabular-nums">{fmt(product.buyingPrice)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Selling
                </p>
                <p className="font-semibold text-foreground tabular-nums">{fmt(product.sellingPrice)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(product)}
                className="flex-1 h-9 gap-1.5 text-[13px] hover:bg-primary/10 hover:text-primary hover:border-primary/40"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(product)}
                className="flex-1 h-9 gap-1.5 text-[13px] hover:bg-red-500/10 hover:text-red-600 hover:border-red-300 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mb-3 opacity-30" />
          {hasActiveFilters ? (
            <>
              <p className="text-sm font-medium">No products match your search</p>
              <p className="text-xs mt-1">Try adjusting your search term or clearing the filters.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs mt-1">Add your first product to get started.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
