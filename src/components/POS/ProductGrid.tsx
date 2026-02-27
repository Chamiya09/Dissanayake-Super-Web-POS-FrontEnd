import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search, Plus,
  ShoppingBag, Apple, Milk, Coffee, Wheat, Cookie, Beef, Leaf,
  Flame, Tag, Sparkles, PackageX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { categories, products, type Product } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryIcon: Record<string, LucideIcon> = {
    All: ShoppingBag,
    Fruits: Apple,
    Dairy: Milk,
    Beverages: Coffee,
    Bakery: Wheat,
    Snacks: Cookie,
    Meat: Beef,
    Vegetables: Leaf,
  };

  // Soft pastel icon-area background per category
  const categoryBg: Record<string, string> = {
    Fruits:     "bg-rose-50",
    Dairy:      "bg-blue-50",
    Beverages:  "bg-sky-50",
    Bakery:     "bg-amber-50",
    Snacks:     "bg-lime-50",
    Meat:       "bg-red-50",
    Vegetables: "bg-green-50",
  };

  // Category accent border color (top strip)
  const categoryBorder: Record<string, string> = {
    Fruits:     "border-t-rose-400",
    Dairy:      "border-t-blue-400",
    Beverages:  "border-t-sky-400",
    Bakery:     "border-t-amber-400",
    Snacks:     "border-t-lime-500",
    Meat:       "border-t-red-400",
    Vegetables: "border-t-green-500",
  };

  const stockBadge = (stock: number) => {
    if (stock === 0)  return { label: "Out of stock", cls: "bg-gray-100 text-gray-500 border border-gray-200" };
    if (stock <= 2)   return { label: `${stock} left!`,  cls: "bg-red-100 text-red-600 border border-red-200" };
    if (stock <= 9)   return { label: `${stock} left`,   cls: "bg-amber-100 text-amber-700 border border-amber-200" };
    return            { label: `${stock} in stock`,      cls: "bg-emerald-50 text-emerald-600 border border-emerald-200" };
  };

  const PLACEHOLDER = "/placeholder.svg";
  const isSearching = search.trim().length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  // [F1] → focus the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-4">

      {/* â”€â”€ Search bar â”€â”€ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products or scan barcode&hellip;"
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card pl-10 pr-12 text-sm shadow-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-mono font-semibold text-muted-foreground/60 pointer-events-none select-none">
          F1
        </kbd>
      </div>


      {/* Category pills - slides away while searching */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isSearching ? "max-h-0 opacity-0 pointer-events-none" : "max-h-16 opacity-100"
        )}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors duration-150",
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {(() => { const Icon = categoryIcon[cat]; return Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null; })()}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length !== 1 ? "products" : "product"}
        {isSearching ? (
          <span className="text-primary font-medium"> &middot; search results</span>
        ) : activeCategory !== "All" ? (
          <span className="text-primary font-medium"> &middot; {activeCategory}</span>
        ) : null}
      </p>

      {/* â”€â”€ Product grid â”€â”€ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => {
          const outOfStock = product.stock === 0;
          const { label: stockLabel, cls: stockCls } = stockBadge(product.stock);
          const salePrice = product.discount
            ? product.price * (1 - product.discount / 100)
            : null;

          return (
          <div
            key={product.id}
            className={cn(
              "group flex flex-col rounded-xl border-t-[3px] border border-border bg-white shadow-sm overflow-hidden transition-all duration-150",
              outOfStock
                ? "opacity-60 cursor-not-allowed border-t-gray-300"
                : "hover:shadow-md hover:border-primary/30 cursor-pointer",
              !outOfStock && (categoryBorder[product.category] ?? "border-t-primary")
            )}
          >
            {/* Compact image strip */}
            <div
              className={cn(
                "relative h-20 sm:h-24 overflow-hidden",
                categoryBg[product.category] ?? "bg-secondary"
              )}
            >
              <img
                src={product.image ?? PLACEHOLDER}
                alt={product.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-200",
                  !outOfStock && "group-hover:scale-105"
                )}
              />

              {/* Out-of-stock overlay */}
              {outOfStock && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/70 backdrop-blur-[2px]">
                  <PackageX className="h-5 w-5 text-gray-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Out of Stock</span>
                </div>
              )}

              {/* Promo badge — top left */}
              {product.isPromo && !outOfStock && (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                  <Flame className="h-2.5 w-2.5" />
                  HOT
                </span>
              )}

              {/* New badge */}
              {!product.isPromo && product.isNew && !outOfStock && (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                  <Sparkles className="h-2.5 w-2.5" />
                  NEW
                </span>
              )}

              {/* Discount badge — top right */}
              {product.discount && !outOfStock && (
                <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                  <Tag className="h-2.5 w-2.5" />
                  -{product.discount}%
                </span>
              )}

              {/* Quick-add button on hover */}
              {!outOfStock && (
                <button
                  onClick={(e) => onAddToCart(product, e)}
                  className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent"
                >
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Info area */}
            <div className="flex flex-col gap-1 px-2.5 pt-2 pb-1.5">
              <p className="truncate text-[11.5px] font-semibold text-foreground leading-tight">
                {product.name}
              </p>

              {/* Price row */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-baseline gap-1">
                  {salePrice ? (
                    <>
                      <span className="text-[11px] font-bold text-red-500 tabular-nums">${salePrice.toFixed(2)}</span>
                      <span className="text-[9px] text-muted-foreground line-through tabular-nums">${product.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-[11px] font-bold text-primary tabular-nums">${product.price.toFixed(2)}</span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">/{product.unit}</span>
              </div>

              {/* Stock badge */}
              <span className={cn("self-start rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold leading-none", stockCls)}>
                {stockLabel}
              </span>
            </div>

            {/* Add to Cart footer */}
            <button
              disabled={outOfStock}
              onClick={(e) => !outOfStock && onAddToCart(product, e)}
              className={cn(
                "mt-auto flex items-center justify-center gap-1 border-t border-border py-1.5 text-[11px] font-semibold transition-colors duration-150 shrink-0",
                outOfStock
                  ? "bg-secondary/30 text-muted-foreground/40 cursor-not-allowed"
                  : "bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-white"
              )}
            >
              <Plus className="h-3 w-3 stroke-[2.5]" />
              {outOfStock ? "Unavailable" : "Add to Cart"}
            </button>
          </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white py-20 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">No products found</p>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search or category</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
