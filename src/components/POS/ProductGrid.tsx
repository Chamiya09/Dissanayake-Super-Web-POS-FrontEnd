import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Search, Plus,
  ShoppingBag, Apple, Milk, Coffee, Wheat, Cookie, Beef, Leaf,
  Flame, Tag, Sparkles, PackageX,
} from "lucide-react";
import { categories as staticCategories, products as staticProducts, type Product } from "@/data/products";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatCurrency";

interface ProductGridProps {
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  products?: Product[];
  keyboardActive?: boolean;
  searchSuffix?: string;
}

export interface ProductGridHandle {
  focusGrid: (preferredIndex?: number) => void;
  focusCategories: () => void;
}

export const ProductGrid = forwardRef<ProductGridHandle, ProductGridProps>(function ProductGrid({
  onAddToCart,
  products: externalProducts,
  keyboardActive = true,
  searchSuffix = "",
}, ref) {
  const productList = externalProducts ?? staticProducts;
  const PAGE_SIZE = 24;
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const [showCategoryRail, setShowCategoryRail] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryOptions = useMemo(() => {
    if (externalProducts && externalProducts.length > 0) {
      const dynamicCategories = [...new Set(externalProducts.map((product) => product.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));
      return ["All", ...dynamicCategories];
    }

    return [...staticCategories];
  }, [externalProducts]);

  useEffect(() => {
    if (!categoryOptions.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [activeCategory, categoryOptions]);

  const skuQuery = searchSuffix.trim() ? `PI${searchSuffix.trim()}`.toLowerCase() : "";

  const filtered = useMemo(() => {
    return productList
      .filter((product) => {
        const matchesSearch = !skuQuery || (product.barcode ?? "").toLowerCase().includes(skuQuery);
        const matchesCategory = activeCategory === "All" || product.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .map((product, index) => ({ product, index }))
      .sort((a, b) => {
        const aInStock = (a.product.stock ?? 0) > 0;
        const bInStock = (b.product.stock ?? 0) > 0;

        if (aInStock && !bInStock) return -1;
        if (!aInStock && bInStock) return 1;
        return a.index - b.index;
      })
      .map(({ product }) => product);
  }, [activeCategory, productList, skuQuery]);

  const visibleProducts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

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

  const categoryBg: Record<string, string> = {
    Fruits: "bg-rose-50 dark:bg-rose-950/20",
    Dairy: "bg-blue-50 dark:bg-blue-950/20",
    Beverages: "bg-sky-50 dark:bg-sky-950/20",
    Bakery: "bg-amber-50 dark:bg-amber-950/20",
    Snacks: "bg-lime-50 dark:bg-lime-950/20",
    Meat: "bg-red-50 dark:bg-red-950/20",
    Vegetables: "bg-green-50 dark:bg-green-950/20",
  };

  const categoryBorder: Record<string, string> = {
    Fruits: "border-t-rose-400",
    Dairy: "border-t-blue-400",
    Beverages: "border-t-sky-400",
    Bakery: "border-t-amber-400",
    Snacks: "border-t-lime-500",
    Meat: "border-t-red-400",
    Vegetables: "border-t-green-500",
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return { label: "Out of stock", cls: "border border-gray-200 bg-gray-100 text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" };
    if (stock <= 2) return { label: `${stock} left!`, cls: "border border-red-200 bg-red-100 text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300" };
    if (stock <= 9) return { label: `${stock} left`, cls: "border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300" };
    return { label: `${stock} in stock`, cls: "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300" };
  };

  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const PLACEHOLDER = isDark ? "/placeholder-dark.svg" : "/placeholder.svg";
  const isSearching = searchSuffix.trim().length > 0;
  const categoriesVisible = !isSearching || showCategoryRail;

  const gridRef = useRef<HTMLDivElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const categoryButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const focusedIdxRef = useRef(focusedIndex);
  const filteredRef = useRef(visibleProducts);

  useEffect(() => {
    focusedIdxRef.current = focusedIndex;
  }, [focusedIndex]);

  useEffect(() => {
    filteredRef.current = visibleProducts;
  }, [visibleProducts]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, visibleProducts.length);
  }, [visibleProducts.length]);

  useEffect(() => {
    categoryButtonRefs.current = categoryButtonRefs.current.slice(0, categoryOptions.length);
  }, [categoryOptions.length]);

  useEffect(() => {
    const activeIndex = Math.max(categoryOptions.indexOf(activeCategory), 0);
    setFocusedCategoryIndex(activeIndex);
  }, [activeCategory, categoryOptions]);

  useEffect(() => {
    setFocusedIndex(-1);
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, searchSuffix]);

  useEffect(() => {
    if (searchSuffix.trim()) {
      setShowCategoryRail(false);
    }
  }, [searchSuffix]);

  useEffect(() => {
    if (focusedIndex < 0) return;
    const focusedCard = cardRefs.current[focusedIndex];
    focusedCard?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (focusedCard && document.activeElement !== focusedCard) {
      focusedCard.focus();
    }
  }, [focusedIndex]);

  const getColCount = () => {
    if (!gridRef.current) return 2;
    return window.getComputedStyle(gridRef.current).gridTemplateColumns.split(" ").length;
  };

  const focusGrid = useCallback((preferredIndex = 0) => {
    setShowCategoryRail(false);

    const items = filteredRef.current;
    if (items.length === 0) {
      setFocusedIndex(-1);
      gridRef.current?.focus();
      return;
    }

    const normalizedIndex = Math.max(
      0,
      Math.min(focusedIdxRef.current >= 0 ? focusedIdxRef.current : preferredIndex, items.length - 1),
    );

    setFocusedIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      cardRefs.current[normalizedIndex]?.focus();
    });
  }, []);

  const focusCategoryButton = useCallback((index: number) => {
    if (categoryOptions.length === 0) return;

    const normalizedIndex = ((index % categoryOptions.length) + categoryOptions.length) % categoryOptions.length;
    setShowCategoryRail(true);
    setFocusedCategoryIndex(normalizedIndex);

    window.requestAnimationFrame(() => {
      categoryButtonRefs.current[normalizedIndex]?.focus();
    });
  }, [categoryOptions.length]);

  const selectCategory = useCallback((index: number) => {
    if (categoryOptions.length === 0) return;

    const normalizedIndex = ((index % categoryOptions.length) + categoryOptions.length) % categoryOptions.length;
    setFocusedCategoryIndex(normalizedIndex);
    setActiveCategory(categoryOptions[normalizedIndex]);
  }, [categoryOptions]);

  useImperativeHandle(ref, () => ({
    focusGrid,
    focusCategories: () => {
      const activeIndex = Math.max(categoryOptions.indexOf(activeCategory), 0);
      focusCategoryButton(activeIndex);
    },
  }), [activeCategory, categoryOptions, focusCategoryButton, focusGrid]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!keyboardActive) return;
      if (event.altKey) return;

      const isInInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      if (isInInput) return;
      if (event.target instanceof Node && categoryRailRef.current?.contains(event.target)) return;

      const cols = getColCount();
      const len = filteredRef.current.length;
      const current = focusedIdxRef.current;

      if (len === 0) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setFocusedIndex(current < 0 ? 0 : Math.min(current + 1, len - 1));
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusedIndex(current <= 0 ? 0 : current - 1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex(current < 0 ? 0 : Math.min(current + cols, len - 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex(current <= 0 ? 0 : Math.max(current - cols, 0));
        return;
      }

      if ((event.key === "Enter" || event.code === "NumpadEnter") && current >= 0) {
        event.preventDefault();
        const product = filteredRef.current[current];
        if (!product || product.stock <= 0 || product.status === "DISCONTINUED") return;

        const card = cardRefs.current[current];
        const rect = card?.getBoundingClientRect();
        onAddToCart(product, {
          clientX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
          clientY: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
        } as React.MouseEvent);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboardActive, onAddToCart]);

  const handleCategoryBlur = useCallback(() => {
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof Node) || !categoryRailRef.current?.contains(activeElement)) {
        setShowCategoryRail(false);
      }
    });
  }, []);

  const handleCategoryKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCategoryButton(index + 1);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCategoryButton(index - 1);
      return;
    }

    if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
      event.preventDefault();
      focusGrid();
      return;
    }

    if (event.key === "Enter" || event.code === "Space" || event.key === " ") {
      event.preventDefault();
      selectCategory(index);
    }
  }, [focusCategoryButton, focusGrid, selectCategory]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          categoriesVisible ? "max-h-16 opacity-100" : "max-h-0 opacity-0 pointer-events-none",
        )}
      >
        <div ref={categoryRailRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryOptions.map((category, index) => (
            <button
              key={category}
              ref={(element) => {
                categoryButtonRefs.current[index] = element;
              }}
              type="button"
              tabIndex={focusedCategoryIndex === index ? 0 : -1}
              onFocus={() => {
                setShowCategoryRail(true);
                setFocusedCategoryIndex(index);
              }}
              onBlur={handleCategoryBlur}
              onKeyDown={(event) => handleCategoryKeyDown(event, index)}
              onClick={() => selectCategory(index)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors duration-150",
                activeCategory === category
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-white text-muted-foreground hover:border-primary hover:text-primary dark:bg-card dark:hover:border-primary",
                focusedCategoryIndex === index && "ring-2 ring-primary ring-offset-2",
              )}
            >
              {(() => {
                const Icon = categoryIcon[category];
                return Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null;
              })()}
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length !== 1 ? "products" : "product"}
          {isSearching ? (
            <span className="font-medium text-primary"> &middot; search results</span>
          ) : activeCategory !== "All" ? (
            <span className="font-medium text-primary"> &middot; {activeCategory}</span>
          ) : null}
        </p>
        <p className="hidden select-none items-center gap-1 text-[10px] text-muted-foreground/50 sm:flex">
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px]">Alt+C</kbd>
          <span>categories</span>
          <span className="mx-0.5">&middot;</span>
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px]">Arrows</kbd>
          <span>navigate</span>
          <span className="mx-0.5">&middot;</span>
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 font-mono text-[9px]">Enter</kbd>
          <span>add</span>
        </p>
      </div>

      <div
        ref={gridRef}
        tabIndex={-1}
        className="grid grid-cols-2 gap-2 outline-none sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {visibleProducts.map((product, index) => {
          const outOfStock = product.stock === 0;
          const orderingBlocked = product.status === "DISCONTINUED";
          const unavailable = outOfStock || orderingBlocked;
          const { label: stockLabel, cls: stockCls } = stockBadge(product.stock);
          const salePrice = product.discount
            ? product.price * (1 - product.discount / 100)
            : null;
          const isFocused = focusedIndex === index;

          return (
            <div
              key={product.id}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              tabIndex={isFocused ? 0 : -1}
              onFocus={() => {
                setShowCategoryRail(false);
                setFocusedIndex(index);
              }}
              aria-disabled={unavailable}
              className={cn(
                "group flex flex-col overflow-hidden rounded-xl border border-border border-t-[3px] bg-card shadow-sm transition-all duration-150 outline-none dark:shadow-black/15",
                unavailable
                  ? "cursor-not-allowed border-t-gray-300 opacity-60"
                  : "cursor-pointer hover:border-primary/30 hover:shadow-md",
                !unavailable && (categoryBorder[product.category] ?? "border-t-primary"),
                isFocused && !unavailable && "ring-2 ring-primary ring-offset-2 shadow-lg",
              )}
            >
              <div
                className={cn(
                  "relative h-20 overflow-hidden sm:h-24",
                  categoryBg[product.category] ?? "bg-secondary",
                )}
              >
                <img
                  src={product.image ?? PLACEHOLDER}
                  alt={product.name}
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                  }}
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-200",
                    !unavailable && "group-hover:scale-105",
                  )}
                />

                {unavailable && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/70 backdrop-blur-[2px]">
                    <PackageX className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      {orderingBlocked ? "Ordering Blocked" : "Out of Stock"}
                    </span>
                  </div>
                )}

                {product.isPromo && !unavailable && (
                  <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                    <Flame className="h-2.5 w-2.5" />
                    HOT
                  </span>
                )}

                {!product.isPromo && product.isNew && !unavailable && (
                  <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                    <Sparkles className="h-2.5 w-2.5" />
                    NEW
                  </span>
                )}

                {product.discount && !unavailable && (
                  <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow">
                    <Tag className="h-2.5 w-2.5" />
                    -{product.discount}%
                  </span>
                )}

                {!unavailable && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(event) => onAddToCart(product, event)}
                    className="absolute bottom-1.5 right-1.5 flex h-6 w-6 translate-y-1 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-accent"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1 px-2.5 pb-1.5 pt-2">
                <p className="truncate text-[11.5px] font-semibold leading-tight text-foreground">
                  {product.name}
                </p>
                {orderingBlocked && (
                  <span
                    title="Ordering Blocked - Discontinued"
                    className="self-start rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[8.5px] font-semibold leading-none text-red-700"
                  >
                    Ordering Blocked - Discontinued
                  </span>
                )}

                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-baseline gap-1">
                    {salePrice ? (
                      <>
                        <span className="tabular-nums text-[11px] font-bold text-red-500">{formatCurrency(salePrice)}</span>
                        <span className="tabular-nums text-[9px] text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                      </>
                    ) : (
                      <span className="tabular-nums text-[11px] font-bold text-primary">{formatCurrency(product.price)}</span>
                    )}
                  </div>
                  <span className="shrink-0 rounded border border-border px-1 py-0.5 text-[9px] text-muted-foreground">/{product.unit}</span>
                </div>

                <span className={cn("self-start rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold leading-none", stockCls)}>
                  {stockLabel}
                </span>
              </div>

              <button
                type="button"
                tabIndex={-1}
                disabled={unavailable}
                title={orderingBlocked ? "Ordering Blocked - Discontinued" : undefined}
                onClick={(event) => {
                  if (!unavailable) {
                    onAddToCart(product, event);
                  }
                }}
                className={cn(
                  "mt-auto flex shrink-0 items-center justify-center gap-1 border-t border-border py-1.5 text-[11px] font-semibold transition-colors duration-150",
                  unavailable
                    ? "cursor-not-allowed bg-secondary/30 text-muted-foreground/40"
                    : "bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-white",
                )}
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
                {orderingBlocked ? "Ordering Blocked" : outOfStock ? "Unavailable" : "Add to Cart"}
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white py-20 shadow-sm dark:bg-card dark:shadow-black/15">
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

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((previous) => previous + PAGE_SIZE)}
            className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";
