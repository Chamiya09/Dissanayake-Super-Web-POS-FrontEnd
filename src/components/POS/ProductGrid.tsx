import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { categories, products, type Product } from "@/data/products";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryEmoji: Record<string, string> = {
    All: "🛍️", Fruits: "🍎", Dairy: "🧀", Beverages: "🥤",
    Bakery: "🥐", Snacks: "🥜", Meat: "🥩", Vegetables: "🥦",
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

  return (
    <div className="flex flex-col gap-4">

      {/* ── Search bar ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products or scan barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg border border-border bg-white pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* ── Category filter pills ── */}
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
            <span>{categoryEmoji[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* ── Results count ── */}
      <p className="text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length !== 1 ? "products" : "product"}
        {activeCategory !== "All" && (
          <span className="text-primary font-medium"> · {activeCategory}</span>
        )}
      </p>

      {/* ── Product grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden transition-all duration-150 hover:shadow-md hover:border-primary/40"
          >
            {/* Icon / image area */}
            <div
              className={cn(
                "relative flex items-center justify-center py-6 text-[2.6rem]",
                categoryBg[product.category] ?? "bg-secondary"
              )}
            >
              {categoryEmoji[product.category] ?? "🛒"}

              {/* Quick-add button — appears on hover */}
              <button
                onClick={() => onAddToCart(product)}
                className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                {product.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {product.category}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <span className="text-[14px] font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  /{product.unit}
                </span>
              </div>
            </div>

            {/* Add to cart footer button */}
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1.5 border-t border-border bg-secondary/50 py-2 text-[12px] font-semibold text-muted-foreground transition-colors duration-150 hover:bg-primary hover:text-white"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              Add to Cart
            </button>
          </div>
        ))}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white py-20 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl">
              🔍
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

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchFocused, setSearchFocused] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryEmoji: Record<string, string> = {
    All: "🛍️", Fruits: "🍎", Dairy: "🧀", Beverages: "🥤",
    Bakery: "🥐", Snacks: "🥜", Meat: "🥩", Vegetables: "🥦",
  };

  // Blue-tinted pastel gradients matching SuperMart theme
  const categoryGradient: Record<string, string> = {
    Fruits:     "from-rose-50 to-pink-50",
    Dairy:      "from-blue-50 to-sky-50",
    Beverages:  "from-sky-50 to-blue-50",
    Bakery:     "from-amber-50 to-orange-50",
    Snacks:     "from-yellow-50 to-lime-50",
    Meat:       "from-red-50 to-rose-50",
    Vegetables: "from-green-50 to-emerald-50",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className={cn(
        "relative transition-all duration-300",
        searchFocused ? "scale-[1.005]" : ""
      )}>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder="Search products or scan barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="h-10 rounded-lg border border-border bg-white pl-11 pr-4 text-[13px] shadow-sm transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200",
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-white border border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
            )}
          >
            <span>{categoryEmoji[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Results bar */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span> {filtered.length !== 1 ? "products" : "product"}
          {activeCategory !== "All" && <span className="text-primary"> · {activeCategory}</span>}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="group relative flex aspect-square flex-col rounded-xl border border-border bg-white p-3 text-left shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            {/* Image area */}
            <div className={cn(
              "mb-2.5 flex flex-1 w-full items-center justify-center rounded-xl text-[2.4rem] bg-gradient-to-br transition-transform duration-200 group-hover:scale-105",
              categoryGradient[product.category] ?? "from-secondary/50 to-secondary/30"
            )}>
              {categoryEmoji[product.category] ?? "🛒"}
            </div>

            {/* Info */}
            <div className="w-full shrink-0">
              <p className="truncate text-[12.5px] font-semibold leading-tight text-foreground">{product.name}</p>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="inline-block rounded-lg bg-primary px-2 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-primary/20">
                  ${product.price.toFixed(2)}
                </span>
                <p className="text-[10px] font-medium text-muted-foreground/80">/{product.unit}</p>
              </div>
            </div>

            {/* Quick-add hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/5 opacity-0 transition-all duration-150 group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md scale-90 transition-transform duration-150 group-hover:scale-100">
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </div>
            </div>
          </button>
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-3xl">
              🔍
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">No products found</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Try a different search or category</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
