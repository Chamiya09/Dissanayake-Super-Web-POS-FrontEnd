import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search, Plus,
  ShoppingBag, Apple, Milk, Coffee, Wheat, Cookie, Beef, Leaf,
  Flame, Tag, Sparkles,
} from "lucide-react";
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

  const PLACEHOLDER = "/placeholder.svg";

  return (
    <div className="flex flex-col gap-4">

      {/* â”€â”€ Search bar â”€â”€ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products or scan barcode&hellip;"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-lg border border-border bg-white pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* â”€â”€ Category filter pills â”€â”€ */}
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

      {/* â”€â”€ Results count â”€â”€ */}
      <p className="text-[12px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
        {filtered.length !== 1 ? "products" : "product"}
        {activeCategory !== "All" && (
          <span className="text-primary font-medium"> &middot; {activeCategory}</span>
        )}
      </p>

      {/* â”€â”€ Product grid â”€â”€ */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="group aspect-square flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden transition-all duration-150 hover:shadow-md hover:border-primary/40"
          >
            {/* Image area — top 55% */}
            <div
              className={cn(
                "relative flex-[0_0_55%] overflow-hidden",
                categoryBg[product.category] ?? "bg-secondary"
              )}
            >
              <img
                src={product.image ?? PLACEHOLDER}
                alt={product.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER; }}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />

              {/* Promo badge — top left */}
              {product.isPromo && (
                <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  <Flame className="h-2.5 w-2.5" />
                  HOT
                </span>
              )}

              {/* New badge — top left (if no promo) */}
              {!product.isPromo && product.isNew && (
                <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  <Sparkles className="h-2.5 w-2.5" />
                  NEW
                </span>
              )}

              {/* Discount badge — top right */}
              {product.discount && (
                <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                  <Tag className="h-2.5 w-2.5" />
                  -{product.discount}%
                </span>
              )}

              {/* Quick-add button on hover */}
              <button
                onClick={() => onAddToCart(product)}
                className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col justify-between px-2.5 py-2 min-h-0">
              <div>
                <p className="truncate text-[11.5px] font-semibold text-foreground leading-tight">
                  {product.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{product.category}</p>
              </div>
              <div className="flex items-end justify-between gap-1">
                <div className="flex flex-col">
                  {product.discount ? (
                    <>
                      <span className="text-[9.5px] text-muted-foreground line-through tabular-nums">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[12px] font-bold text-red-500 tabular-nums leading-tight">
                        ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[12px] font-bold text-primary tabular-nums">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
                  /{product.unit}
                </span>
              </div>
            </div>

            {/* Add to Cart footer */}
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1 border-t border-border bg-secondary/50 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors duration-150 hover:bg-primary hover:text-white shrink-0"
            >
              <Plus className="h-3 w-3 stroke-[2.5]" />
              Add to Cart
            </button>
          </div>
        ))}

        {/* â”€â”€ Empty state â”€â”€ */}
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
