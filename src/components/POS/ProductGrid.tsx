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

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className={cn(
        "relative transition-all duration-300",
        searchFocused ? "scale-[1.02]" : ""
      )}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products or scan barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="h-11 rounded-2xl border-border/60 bg-card pl-10 shadow-sm transition-shadow focus:shadow-md focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="group relative flex aspect-square flex-col items-start rounded-2xl border border-border/50 bg-card p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30"
          >
            {/* Image placeholder */}
            <div className="mb-2 flex flex-1 w-full items-center justify-center rounded-xl bg-secondary/60 text-4xl">
              {product.category === "Fruits" ? "🍎" :
               product.category === "Dairy" ? "🧀" :
               product.category === "Beverages" ? "🥤" :
               product.category === "Bakery" ? "🥐" :
               product.category === "Snacks" ? "🥜" :
               product.category === "Meat" ? "🥩" : "🛒"}
            </div>

            {/* Info */}
            <div className="w-full shrink-0">
              <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <p className="text-xs text-muted-foreground">/{product.unit}</p>
              </div>
            </div>

            {/* Quick Add overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
