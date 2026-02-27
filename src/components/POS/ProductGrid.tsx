import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { categories, products, type Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

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
